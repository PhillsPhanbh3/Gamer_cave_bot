const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { supportinvite } = require("../../../../../utils/support-invite");
const { logger } = require("../../../../../utils/logger");
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, warning_emote, success_emote } = require("../../../../../utils/emotes");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-server')
        .setDescription('Lock the entire server (text, announcement, and forum channels)')
        .addBooleanOption(option =>
            option
                .setName('include_threads')
                .setDescription('Also restrict thread posting and lock existing active threads')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const includeThreadsOpt = interaction.options.getBoolean('include_threads');
        const includeThreads = includeThreadsOpt === null ? true : includeThreadsOpt;

        try {
            await interaction.deferReply({ flags: 64 });
            await interaction.editReply(`${warning_emote} Starting server lock... This may take a moment.`);

            const guild = interaction.guild;
            if (!guild) {
                await interaction.editReply(`${error_emote} Unable to resolve the server context.`);
                return;
            }

            const everyoneRole = guild.roles.everyone;
            const channels = await guild.channels.fetch();

            const targetChannelTypes = new Set([
                ChannelType.GuildText,
                ChannelType.GuildAnnouncement,
                ChannelType.GuildForum
            ]);

            let affected = 0;
            const errors = [];

            for (const [, ch] of channels) {
                if (!ch || !targetChannelTypes.has(ch.type)) continue;

                try {
                    // Parent channel overwrites for @everyone
                    const overwriteData = {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicThreads: includeThreads ? false : undefined,
                        CreatePrivateThreads: includeThreads ? false : undefined,
                        SendMessagesInThreads: includeThreads ? false : undefined
                    };
                    Object.keys(overwriteData).forEach(key => overwriteData[key] === undefined && delete overwriteData[key]);

                    await ch.permissionOverwrites.edit(everyoneRole, overwriteData);
                    affected++;

                    // Lock existing active threads via setLocked (threads don't have permissionOverwrites)
                    if (includeThreads) {
                        try {
                            const activeThreads = await ch.threads.fetchActive();
                            for (const [, th] of activeThreads.threads) {
                                try {
                                    // Lock the thread so non-moderators cannot post
                                    await th.setLocked(true);
                                    // Optional: archive to fully stop conversation visibility/posting
                                    // await th.setArchived(true);
                                    affected++;
                                } catch (e) {
                                    errors.push({ id: th.id, name: th.name, type: th.type, error: e?.message ?? String(e) });
                                }
                            }
                        } catch (e) {
                            errors.push({ id: ch.id, name: ch.name, type: ch.type, error: `FetchActiveThreads: ${e?.message ?? String(e)}` });
                        }
                    }
                } catch (e) {
                    errors.push({ id: ch.id, name: ch.name, type: ch.type, error: e?.message ?? String(e) });
                }
            }

            const summary = `${success_emote} Server lock complete. Affected: ${affected}.` +
                (errors.length ? ` ${error_emote} Failed on ${errors.length} item(s).` : '');

            await interaction.editReply(summary);

            const logEmbed = new EmbedBuilder()
                .setTitle('Server Locked')
                .setDescription(`${warning_emote} ${interaction.user} locked the server.\n\nAffected: ${affected}\nFailed: ${errors.length}`)
                .setColor('Red')
                .setTimestamp();

            try {
                await interaction.channel.send({ embeds: [logEmbed] });
            } catch (e) {
                logger.warn(`[Beta Lock Server] Unable to send log embed in channel ${interaction.channel?.id}: ${e?.message ?? e}`);
            }

            if (errors.length) {
                logger.error(`[Beta Lock Server] Completed with ${errors.length} errors. First error: ${errors[0]?.error}`);
            }
        } catch (err) {
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`);
                } else {
                    await interaction.reply({ content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`, flags: 64 });
                }
            } catch {}

            logger.error(`[Beta Lock Server] Error executing command for ${interaction.user?.tag ?? interaction.user?.id}: ${err?.message ?? err}`, err);
            LogError(err, interaction, 'commands/slash/public/moderation/enforcement/lock/lock_server.js');
        }
    }
};
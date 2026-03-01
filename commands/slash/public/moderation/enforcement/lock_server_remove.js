const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { supportinvite } = require("../../../../../utils/support-invite");
const { logger } = require("../../../../../utils/logger");
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, success_emote, warning_emote } = require("../../../../../utils/emotes");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-remove-server')
        .setDescription('Remove server-wide lock for text, announcement, and forum channels')
        .addBooleanOption(option =>
            option
                .setName('include_threads')
                .setDescription('Also restore thread posting and unlock existing active threads')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const includeThreadsOpt = interaction.options.getBoolean('include_threads');
        const includeThreads = includeThreadsOpt === null ? true : includeThreadsOpt;

        try {
            // Defer once (ephemeral), then edit the reply as we progress
            await interaction.deferReply({ flags: 64 });
            await interaction.editReply(`${warning_emote} Starting server unlock... This may take a moment.`);

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

            // Unlock text/announcement/forum channels
            for (const [, ch] of channels) {
                if (!ch || !targetChannelTypes.has(ch.type)) continue;

                try {
                    const overwriteData = {
                        SendMessages: true,
                        AddReactions: true,
                        CreatePublicThreads: includeThreads ? true : undefined,
                        CreatePrivateThreads: includeThreads ? true : undefined,
                        SendMessagesInThreads: includeThreads ? true : undefined
                    };

                    // Remove undefined keys
                    Object.keys(overwriteData).forEach(key => overwriteData[key] === undefined && delete overwriteData[key]);

                    await ch.permissionOverwrites.edit(everyoneRole, overwriteData);
                    affected++;

                    // Optionally unlock existing active threads (best-effort)
                    if (includeThreads && (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement)) {
                        try {
                            const active = await ch.threads.fetchActive();
                            for (const [, th] of active.threads) {
                                try {
                                    await th.permissionOverwrites.edit(everyoneRole, {
                                        SendMessages: true,
                                        AddReactions: true
                                    });
                                    affected++;
                                } catch (e) {
                                    errors.push({ id: th.id, name: th.name, type: th.type, error: e?.message ?? String(e) });
                                }
                            }
                        } catch (e) {
                            // If fetching active threads fails, record and continue
                            errors.push({ id: ch.id, name: ch.name, type: ch.type, error: `FetchActiveThreads: ${e?.message ?? String(e)}` });
                        }
                    }
                } catch (e) {
                    errors.push({ id: ch.id, name: ch.name, type: ch.type, error: e?.message ?? String(e) });
                }
            }

            const summary = `${success_emote} Server unlock complete. Affected: ${affected}.` +
                (errors.length ? ` ${error_emote} Failed on ${errors.length} item(s).` : '');

            await interaction.editReply(summary);

            // Public log embed (visible to everyone in the invocation channel)
            const logEmbed = new EmbedBuilder()
                .setTitle('Server Unlocked')
                .setDescription(`${success_emote} ${interaction.user} removed the server lock.\n\nAffected: ${affected}\nFailed: ${errors.length}`)
                .setColor('Green')
                .setTimestamp();

            // Send to the current channel as a visible message
            try {
                await interaction.channel.send({ embeds: [logEmbed] });
            } catch (e) {
                // Fallback: if the interaction channel can't send messages (e.g., threads or perms), just log
                logger.warn(`[Beta Lock Remove Server] Unable to send log embed in channel ${interaction.channel?.id}: ${e?.message ?? e}`);
            }

            if (errors.length) {
                logger.error(`[Beta Lock Remove Server] Completed with ${errors.length} errors. First error: ${errors[0]?.error}`);
            }
        } catch (err) {
            // If deferred, edit the reply; otherwise do an ephemeral reply
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`);
                } else {
                    await interaction.reply({
                        content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`,
                        flags: 64
                    });
                }
            } catch {}

            logger.error(`[Beta Lock Remove Server] Error executing command for ${interaction.user?.tag ?? interaction.user?.id}: ${err?.message ?? err}`, err);
            LogError(err, interaction, 'commands/slash/public/moderation/enforcement/lock/lock_remove_server.js');
        }
    }
};
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { supportinvite } = require("../../../../../utils/support-invite");
const { logger } = require("../../../../../utils/logger");
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, warning_emote, success_emote } = require("../../../../../utils/emotes");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-channel')
        .setDescription('Lock a channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('Select a channel to lock')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client) {
        try {
            // Defer early to avoid timeouts and allow a single edit later
            await interaction.deferReply({ flags: 64 });

            const channel = interaction.options.getChannel('channel');
            if (!channel) {
                await interaction.editReply({ content: `${error_emote} The specified channel could not be found.` });
                return;
            }

            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: false,
                AddReactions: false,
            });

            await interaction.editReply({ content: `${success_emote} The channel has been locked successfully.` });

            // Post a visible log embed in the channel (non-ephemeral)
            const logEmbed = new EmbedBuilder()
                .setTitle('Channel Locked')
                .setDescription(`${warning_emote} Channel ${channel} has been locked by ${interaction.user}.`)
                .setColor('Red')
                .setTimestamp();

            await channel.send({ embeds: [logEmbed] });
        } catch (err) {
            // If the interaction was already deferred, use editReply; otherwise, fallback to followUp
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}` });
                } else {
                    await interaction.reply({ content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`, flags: 64 });
                }
            } catch {}

            logger.error(`[Beta Lock Channel] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
            LogError(err, interaction, 'commands/slash/public/moderation/enforcement/lock/lock_channel.js');
        }
    }
}
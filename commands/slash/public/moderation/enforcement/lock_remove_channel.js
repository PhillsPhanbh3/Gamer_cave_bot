const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { supportinvite } = require("../../../../../utils/support-invite");
const { logger } = require("../../../../../utils/logger");
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, success_emote } = require("../../../../../utils/emotes");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-remove-channel')
        .setDescription('Remove lock on a channel')
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('Select a channel to remove lock from')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction, client) {
        try {
            // Defer once; we’ll edit this reply later
            await interaction.deferReply({ flags: 64 });

            const channel = interaction.options.getChannel('channel');
            if (!channel) {
                await interaction.editReply({ content: `${error_emote} The specified channel could not be found.` });
                return;
            }

            // Restore @everyone permissions
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: true,
                AddReactions: true,
            });

            await interaction.editReply({ content: `${success_emote} The channel has been unlocked successfully.` });

            // Public log in the unlocked channel
            const logEmbed = new EmbedBuilder()
                .setTitle('Channel Unlocked')
                .setDescription(`${success_emote} Channel ${channel} has been unlocked by ${interaction.user}.`)
                .setColor('Green')
                .setTimestamp();

            await channel.send({ embeds: [logEmbed] });
        } catch (err) {
            // If already deferred/replied, edit; otherwise reply ephemerally
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({
                        content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`
                    });
                } else {
                    await interaction.reply({
                        content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`,
                        flags: 64
                    });
                }
            } catch {}

            logger.error(`[Beta Lock Remove Channel] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
            LogError(err, interaction, 'commands/slash/public/moderation/enforcement/lock/lock_remove_channel.js');
        }
    }
}
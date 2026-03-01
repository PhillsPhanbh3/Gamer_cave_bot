const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { logger } = require('../../../../../utils/logger');
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, warning_emote, success_emote } = require("../../../../../utils/emotes");
const { supportinvite } = require("../../../../../utils/support-invite");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a text channel')
        .addIntegerOption(option => option
            .setName('duration')
            .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
            .setRequired(true))
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('Select a channel to set slowmode for (defaults to current channel)')
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction, client) {
        const duration = interaction.options.getInteger('duration');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        try {
            await interaction.deferReply({ flags: 64 });

            if (!channel || !channel.isTextBased()) {
                await interaction.editReply({ content: `${warning_emote} The specified channel is not a text-based channel.` });
                return;
            }
            if (duration < 0 || duration > 21600) {
                await interaction.editReply({ content: `${warning_emote} Slowmode duration must be between 0 and 21600 seconds.` });
                return;
            }
            await channel.setRateLimitPerUser(duration, `Slowmode set by ${interaction.user.tag} via Beta Slowmode command`);

            await interaction.editReply({ content: `${success_emote} Slowmode for channel ${channel} has been set to ${duration} seconds.` });
            const logEmbed = new EmbedBuilder()
                .setTitle('Slowmode Updated')
                .setDescription(`${warning_emote} Slowmode for channel ${channel} has been set to ${duration} seconds by ${interaction.user}.`)
                .setColor('Orange')
                .setTimestamp();
            await channel.send({ embeds: [logEmbed] });
        } catch (error) {
            logger.error(`[Beta Slowmode] Error executing command for ${interaction.user.tag}: ${error?.message ?? error}`, error, client);
            LogError(error, interaction.client, 'commands/slash/public/moderation/enforcement/slowmode.js');
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}` });
                } else {
                    await interaction.reply({ content: `${error_emote} An error occurred while executing the command. If you need assistance, please join our support server ${supportinvite}`, flags: 64 });
                }
            } catch {
                // Ignore secondary errors
            }
        }
    }
}
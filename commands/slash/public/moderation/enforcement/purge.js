const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { logger } = require("../../../../../utils/logger");
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, success_emote } = require("../../../../../utils/emotes");
const { supportinvite } = require("../../../../../utils/support-invite");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge messages in a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addChannelOption(option => option
            .setName('channel')
            .setDescription('The channel to purge messages from').setRequired(true))
        .addIntegerOption(option => option
            .setName('amount')
            .setDescription('The number of messages to purge (max 100)').setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)),
    async execute(interaction, ) {
        const channel = interaction.options.getChannel('channel');
        const amount = interaction.options.getInteger('amount');
        try {
            if (!channel.isTextBased()) {
                await interaction.reply({ content: `${error_emote} The specified channel is not a text channel.`, flags: 64 });
                return;
            }
            const messages = await channel.messages.fetch({ limit: amount });
            const deletedMessages = await channel.bulkDelete(messages, true);
            await interaction.reply({ content: `${success_emote} Successfully purged ${deletedMessages.size} messages in ${channel}.`, flags: 64 });
            const logEmbed = new EmbedBuilder()
                .setTitle('Messages Purged')
                .setColor('Red')
                .setDescription(`${success_emote}A total of ${deletedMessages.size} messages were purged in ${channel}.`)
                .addFields(
                    { name: 'Channel', value: `${channel}`, inline: true },
                    { name: 'Amount', value: `${deletedMessages.size}`, inline: true },
                    { name: 'Purged By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                )
                .setTimestamp();
            await interaction.channel.send({ embeds: [logEmbed] });
            // You can send this embed to a log channel if needed
        } catch (err) {
            if (err && err.code === 10062) return;
            await interaction.reply({ content: `${error_emote} An error occurred while trying to purge messages. Please ensure I have the necessary permissions and try again. If the issue persists, contact support: ${supportinvite}`, flags: 64 });
            logger.error(`[Stable Purge] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
            LogError(err, interaction, 'commands/slash/public/moderation/enforcement/purge.js');
        }
    }
}
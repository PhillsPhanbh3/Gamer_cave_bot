const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout-remove')
        .setDescription('Removes a timeout from a server member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to remove the timeout from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for removing the timeout from the user')),

    async execute(interaction) {
        const timeUser = interaction.options.getUser('user');
        let timeMember;

        // Check for necessary permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return await interaction.reply({
                content: `${warning_emote} You must have the Moderate Members permission to use this command.`,
                flags: 64
            });
        }

        // Fetch the member
        try {
            timeMember = await interaction.guild.members.fetch(timeUser.id);
        } catch {
            return await interaction.reply({
                content: `${warning_emote} The user mentioned is no longer within the server.`,
                flags: 64
            });
        }

        // Additional checks
        if (!timeMember.kickable) {
            return await interaction.reply({
                content: `${warning_emote} I cannot remove the timeout from this user! Ensure I have sufficient permissions.`,
                flags: 64
            });
        }

        if (interaction.member.id === timeMember.id) {
            return await interaction.reply({
                content: `${warning_emote} You cannot remove the timeout from yourself!`,
                flags: 64
            });
        }

        if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({
                content: `${warning_emote} You cannot remove the timeout from a person with Administrator permissions.`,
                flags: 64
            });
        }

        const reason = interaction.options.getString('reason') || 'No reason given';

        // Remove timeout
        try {
            await timeMember.timeout(null, reason);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`${success_emote} ${timeUser.tag}'s timeout has been **removed** | ${reason}`);

            const dmEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`${success_emote} Your timeout in ${interaction.guild.name} has been removed. Reason: ${reason}`);
            // Notify the user in DMs
            await timeMember.send({ embeds: [dmEmbed] }).catch((error) => {
                logger.error(error, interaction.client);
            });

            // Reply to the interaction with a mention and the embed
            await interaction.reply({
            content: `${timeUser}`, // this pings the user
            embeds: [embed]
            });
        } catch (error) {
            logger.error(error, interaction.client);
            LogError(error, interaction, 'timeout_remove');
            await interaction.reply({content: `${error_emote} Gamer Cave Bot had an issue removing a timeout from a member due to a Discord API error or missing "Moderate Members" permission. Please report this to the support server ${supportinvite}`, flags: 64});
        }
    }
};
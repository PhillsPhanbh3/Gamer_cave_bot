const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote, banned_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user you want to ban')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Reason for banning the user')),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || "No reason given.";

        // Check permission
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: `${warning_emote} You don't have permission to ban members.`, flags: 64 });
        }

        // Prevent banning self
        if (interaction.member.id === user.id) {
            return interaction.reply({ content: `${warning_emote} You can't ban yourself.`, flags: 64 });
        }

        // Get user object (might be uncached)
        const banUser = await client.users.fetch(user.id).catch(() => null);
        if (!banUser) {
            return interaction.reply({ content: `${warning_emote} Couldn't find the user to ban, please check user ID or mention. Please join our support server for help: ${supportinvite}`, flags: 64 });
        }

        // Try banning the user
        try {
            await interaction.guild.bans.create(banUser.id, { reason });
        } catch (err) {
            logger.error(err, client)
            LogError(err, interaction, 'ban');
            return interaction.reply({ content: `${error_emote} An error occurred while banning the user, this could be due to me not having the "Ban Members" permission or a Discord API error. Please join our support server for help: ${supportinvite}`, flags: 64 });
        }

        // Try to send DM first
        const dmEmbed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`${banned_emote} You have been banned from **${interaction.guild.name}** | ${reason}`);
        
        try {
            await banUser.send({ embeds: [dmEmbed] });
        } catch (err) {
            logger.error(`Could not send ban DM to ${banUser.tag}.`, client);
            LogError(err, interaction, 'ban');
            // Continue even if DM fails to the banned user message to moderator
        }

        // Final response
        const resultEmbed = new EmbedBuilder()
            .setColor("DarkAqua")
            .setDescription(`${success_emote} **${banUser.tag}** has been banned | ${reason}`);

        return interaction.reply({ embeds: [resultEmbed] });
    }
};
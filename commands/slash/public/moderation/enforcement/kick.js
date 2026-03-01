const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote, kicked_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('kick a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user you would like to kick out of the server').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for kicking the user')),
    async execute (interaction, client) {

        const kickUser = interaction.options.getUser('target');
        const kickMember = await interaction.guild.members.fetch(kickUser.id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return await interaction.reply({ content: `${warning_emote} You can't execute this command because you don't have the **KICK MEMBERS** permission!`, flags: 64});
        if (!kickMember) return await interaction.reply({ content: `${warning_emote} The user mentioned is not in the server`, flags: 64});
        if (!kickMember.kickable) return await interaction.reply({ content: `${warning_emote} I can't kick this user because they have roles that is above me or you`, flags: 64});

        let reason = interaction.options.getString('reason');
        if (!reason) reason = "No reason given.";

        const dmEmbed = new EmbedBuilder()
        .setColor("DarkOrange")
        .setDescription(`${kicked_emote} You have been kicked from the server **${interaction.guild.name}** | ${reason}`)

        const embed = new EmbedBuilder()
        .setColor("Navy")
        .setDescription(`${success_emote} ${kickUser.tag} has been **kicked** | ${reason}`)

        await kickMember.send ({ embeds: [dmEmbed] }).catch(err => {
            return;
        });

        await kickMember.kick(reason).catch(error => {
            logger.error(error, client);
            LogError(error, interaction, 'kick');
            return interaction.reply({ 
                content: `${error_emote} An error occurred while kicking the user due to a possible API error or missing "Kick Members" permission. Please join our support server for help: ${supportinvite}`, 
                flags: 64 
            });
        });

        await interaction.reply({ embeds: [embed] });

    }
}
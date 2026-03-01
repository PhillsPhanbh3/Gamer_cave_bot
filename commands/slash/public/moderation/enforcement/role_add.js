const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role-add')
        .setDescription('Add a role to a user in the server')
        .addUserOption(option => option.setName('target').setDescription('The user you would like to add a role to').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role you would like to add to the user').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for adding the role to the user'))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),
    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return await interaction.reply({ content: `${warning_emote} You can't execute this command because you don't have the **MANAGE ROLES** permission!`, flags: 64 });
        }
        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch {
            return await interaction.reply({ content: `${warning_emote} The user mentioned is not in the server`, flags: 64 });
        }
        if (!targetMember.manageable) {
            return await interaction.reply({ content: `${warning_emote} I can't add this role to the user because their highest role is above mine or yours`, flags: 64 });
        }
        if (targetMember.roles.cache.has(role.id)) {
            return await interaction.reply({ content: `${warning_emote} The user already has the role ${role.name}`, flags: 64 });
        }
        try {
            await targetMember.roles.add(role, reason + ' | Role added by ' + interaction.user.tag);
        } catch (error) {
            logger.error(error, client);
            LogError(error, interaction, 'role-add');
            return interaction.reply({
                content: `${error_emote} An error occurred while adding the role to the user due to a possible API error or missing "Manage Roles" permission. Please join our support server for help: ${supportinvite}`,
                flags: 64
            });
        }
        const Embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('✅ Role Added')
            .setDescription(`${success_emote} Successfully added the role ${role.name} to ${targetUser.tag} | Reason: ${reason} | Added by ${interaction.user.tag}`);
        await interaction.reply({ embeds: [Embed] });
    }
}
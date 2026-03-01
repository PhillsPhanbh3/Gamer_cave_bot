const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Times out a server member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user you want to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setRequired(true)
                .setDescription('The duration of the timeout')
                .addChoices(
                    { name: '15 seconds', value: '15' },
                    { name: '30 seconds', value: '30' },
                    { name: '45 seconds', value: '45' },
                    { name: '60 seconds', value: '60' },
                    { name: '2 minutes', value: '120' },
                    { name: '5 minutes', value: '300' },
                    { name: '10 minutes', value: '600' },
                    { name: '20 minutes', value: '1200' },
                    { name: '30 minutes', value: '1800' },
                    { name: '45 minutes', value: '2700' },
                    { name: '1 hour', value: '3600' },
                    { name: '2 hours', value: '7200' },
                    { name: '3 hours', value: '10800' },
                    { name: '6 hours', value: '21600' },
                    { name: '12 hours', value: '43200' },
                    { name: '1 day', value: '86400' },
                    { name: '2 days', value: '172800' },
                    { name: '3 days', value: '259200' },
                    { name: '5 days', value: '432000' },
                    { name: '1 week', value: '604800' },
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for timing out the user')),
    
    async execute(interaction) {
        const timeUser = interaction.options.getUser('user');
        const duration = Number(interaction.options.getString('duration'));

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return await interaction.reply({ content: `${warning_emote} You must have the moderate members permission to use this command.`, flags: 64 });
        }

        let timeMember;
        try {
            timeMember = await interaction.guild.members.fetch(timeUser.id);
        } catch {
            return await interaction.reply({ content: `${warning_emote} The user mentioned is no longer within the server.`, flags: 64 });
        }

        if (!timeMember.kickable) {
            return await interaction.reply({ content: `${warning_emote} I cannot timeout this user! That is because either their role has admin permissions or they are above me!`, flags: 64 });
        }

        if (interaction.member.id === timeMember.id) {
            return await interaction.reply({ content: `${warning_emote} You cannot timeout yourself!`, flags: 64 });
        }

        if (timeMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: `${warning_emote} You cannot timeout a person with administrator permissions.`, flags: 64 });
        }

        const reason = interaction.options.getString('reason') || 'No reason given';

        try {
            await timeMember.timeout(duration * 1000, reason);

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setDescription(`${success_emote} ${timeUser.tag} has been **timed out** for ${duration / 60} minute(s) because: ${reason}`);

            const dmEmbed = new EmbedBuilder()
                .setColor("Blue")
                .setDescription(`${success_emote} You have been timed out in ${interaction.guild.name} for ${duration / 60} minute(s). Reason: ${reason}`);

            await timeMember.send({ embeds: [dmEmbed] }).catch(() => {
                logger.error('Failed to send DM to the user.', interaction.client);
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(error, interaction.client);
            LogError(error, interaction, 'timeout');
            await interaction.reply({ content: `${error_emote} Gamer Cave Bot had an issue timing out a member due to a Discord API error or missing "Moderate Members" permission. Please report this to the support server ${supportinvite}`, flags: 64 });
        }
    }
};
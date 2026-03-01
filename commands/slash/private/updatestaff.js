const { SlashCommandBuilder } = require('discord.js');
const { updateStaffEmbed } = require('../../../utils/staffMonitor');
const fs = require('fs');
const path = require('path');
const { LogError } = require('../../../utils/LogError');
const { logger } = require('../../../utils/logger');

const devRoleId = '1305874664672727103';
const messagePath = path.join(__dirname, '../../../data/staffMessage.json');

function loadMessageData() {
    if (!fs.existsSync(messagePath)) return [];
    const raw = fs.readFileSync(messagePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
}

function saveMessageData(data) {
    fs.writeFileSync(messagePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('force-update-staff-embed')
        .setDescription('Force update the staff embed'),

    async execute(interaction, client) {
        if (!interaction.member.roles.cache.has(devRoleId)) {
            return interaction.reply({
                content: '❌ You do not have permission to use this command.',
                flags: 64
            });
        }

        try {
            const guildId = interaction.guild.id;
            let data = loadMessageData();

            const removed = data.filter(r => r.guildId === guildId);
            data = data.filter(r => r.guildId !== guildId);
            saveMessageData(data);

            if (removed.length > 0) {
                logger.info(`[Staff Embed] Removed old messageId for guild ${guildId} (force update).`);
            } else {
                logger.info(`[Staff Embed] No previous messageId found for guild ${guildId} (force update).`);
            }

            await updateStaffEmbed(interaction.client, true);
            logger.info(`[Staff Embed] Staff embed sent/updated for guild ${guildId} via force update.`);

            return interaction.reply({
                content: '✅ Staff embed reset and updated successfully!',
                flags: 64
            });
        } catch (error) {
            logger.error('[Staff Embed] Error in force-update-staff-embed command', { error });
            await LogError(error, interaction.client, 'commands/slash/private/updatestaff.js');

            return interaction.reply({
                content: '❌ An error occurred while updating the staff embed. Please check the logs for details.',
                flags: 64
            });
        }
    }
};
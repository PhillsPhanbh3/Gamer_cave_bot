const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        client.logger.info(`Report Moderation Event Loaded`);
    }
};
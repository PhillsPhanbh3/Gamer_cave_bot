const { Events } = require('discord.js');
const { LogError } = require('../../utils/LogError');
const BetaTempban = require('../../schema/tempban');
const { logger } = require('../../utils/logger');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        async function unban(banData) {
            const delay = banData.BanTime - Date.now();
            if (delay <= 0) return;

            setTimeout(async () => {
                try {
                    const guild = await client.guilds.fetch(banData.Guild);
                    await guild.bans.remove(banData.User, 'Temporary ban duration expired');
                    await BetaTempban.deleteOne({ Guild: banData.Guild, User: banData.User });
                } catch (error) {
                    logger.error(`Error unbanning user ${banData.User} in guild ${banData.Guild}: ${error}`);
                    LogError(error, client, 'tempban_unban');
                }
            }, delay);
        }

        const data = await BetaTempban.find();
        data.forEach(unban);

        BetaTempban.watch().on('change', async (change) => {
            if (change.operationType === 'insert') {
                const banData = change.fullDocument;
                unban(banData);
            }
        });
    }
}
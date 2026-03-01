const { EmbedBuilder, Events } = require('discord.js');
const Reminder = require('../../schema/reminder');
const { LogError } = require('../../utils/LogError');
const { logger } = require('../../utils/logger');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        async function sendReminder(reminderData) {
            try {
                const member = await client.users.fetch(reminderData.User);
                const text = reminderData.Reminder ?? '⏰ Reminder!';
                const embed = new EmbedBuilder()
                    .setTitle('⏰ Reminder!')
                    .setDescription(`This is your reminder: ${text}`)
                    .setColor('#0099ff')
                    .setTimestamp();

                await member.send({ embeds: [embed] });
                await Reminder.deleteOne({ _id: reminderData._id });

                logger.info(`Reminder with ID: ${reminderData._id} for user ID: ${reminderData.User} has been deleted after being sent to user.`);
            } catch (e) {
                logger.error("Error sending reminder:", e);
                LogError(client, "events/reminder.js", e);
            }
        }

        function scheduleReminder(reminderData) {
            const remTime = typeof reminderData.RemTime === 'number'
                ? reminderData.RemTime
                : new Date(reminderData.RemTime).getTime();

            let delay = remTime - Date.now();

            setTimeout(async () => {
                await sendReminder(reminderData);
            }, delay);
        }

        try {
            const reminders = await Reminder.find();
            reminders.forEach(scheduleReminder);

            try {
                const changeStream = Reminder.watch();
                changeStream.on('change', async (change) => {
                    if (change.operationType === 'insert') {
                        const newReminder = change.fullDocument;
                        scheduleReminder(newReminder);
                    }
                });
            } catch (watchErr) {
                logger.warn('Reminder.watch() unavailable (requires replica set). New reminders will not auto-schedule via change streams.');
                LogError(client, "events/reminder.js - watch()", watchErr);
            }
        } catch (err) {
            logger.error('Error initializing reminders:', err);
            LogError(client, "events/reminder.js - init", err);
        }
    }
};
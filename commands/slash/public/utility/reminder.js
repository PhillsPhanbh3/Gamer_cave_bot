const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Reminder = require("../../../../schema/reminder");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription("Set a reminder and Gamer Cave Bot will remind you!")
    .addStringOption((option) => option.setName('reminder').setDescription('What do you want to be reminded about?').setRequired(true))
    .addStringOption((option) => option.setName('time').setDescription('Time until reminder (e.g., 10m, 2h)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewChannel),
    async execute(interaction) {
        const { options } = interaction;
        const reminder = options.getString("reminder");
        const time = options.getString("time");
        const duration = ms(time);

        async function sendMessage(message) {
            const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(message);

            await interaction.reply({ embeds: [embed], flags: 64 });
        }

        if (isNaN(duration)) return await sendMessage(`⚠ ${time} is not a number! use your number followed by time: 5s, 1m, 1d`);

        await Reminder.create({
            User: interaction.user.id,
            RemTime: Date.now() + duration,
            Reminder: reminder
        });

        await sendMessage(`✅ I have set a reminder for \`${time}\` for now saying **${reminder}** and will notify you when it is time!`);
    }
}
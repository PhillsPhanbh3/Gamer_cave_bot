const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    Name: "poke",
    Description: "Poke the bot!",
    Permissions: {
        user: [PermissionFlagsBits.SendMessages],
        bot: [PermissionFlagsBits.ReadMessageHistory],
    },
    execute: async ( interaction, client, message) => {
        const button = new ButtonBuilder()
		.setCustomId('poke')
		.setStyle(ButtonStyle.Primary)
		.setLabel('Poke me!');

		const row = new ActionRowBuilder()
		.addComponents(button);

		await interaction.reply({
			content: 'Poke me!',
			components: [row],
		});
    }
}
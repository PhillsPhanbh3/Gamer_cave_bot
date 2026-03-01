const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { logger } = require('../../../../utils/logger');
const { LogError } = require('../../../../utils/LogError');
const { supportinvite } = require('../../../../utils/support-invite');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poke')
		.setDescription('Poke the bot!'),
	async execute(interaction, client) {
		try {
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
		} catch (error) {
			LogError(error, client, 'stable-poke', interaction);
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: `An unexpected error occurred while processing your request. The error has been logged. Please join our support server for help: ${supportinvite}`,
						flags: 64,
					});
				} else {
					await interaction.reply({
						content: `An unexpected error occurred while processing your request. The error has been logged. Please join our support server for help: ${supportinvite}`,
						flags: 64,
					});
				}
			} catch (notifyError) {
				logger.error('[slash:poke] Failed to notify user about the error:', notifyError);
			}
		}
	}
};
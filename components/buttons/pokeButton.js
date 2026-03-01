const { LogError } = require('../../utils/LogError');
const { logger } = require('../../utils/logger');
const { supportinvite } = require('../../utils/support-invite');

module.exports = {
	customId: 'poke',
	async execute(interaction, client) {
		try {
			await interaction.reply({
				content: 'Ouch that hurts! :c',
				flags: 64,
			});
		} catch (error) {
			logger.error(`[pokeButton] Error handling button interaction for user ${interaction.user?.tag ?? interaction.user?.id}:`, error);
            LogError(error, interaction, 'pokeButton');

			// Try to notify the user about the error
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({
						content: `An error occurred handling the button. The error has been logged. Please report this to the support server if you want to ${supportinvite}`,
						flags: 64,
					});
				} else {
					await interaction.reply({
						content: `An error occurred handling the button. The error has been logged. Please report this to the support server if you want to ${supportinvite}`,
						flags: 64,
					});
				}
			} catch (notifyError) {
				logger.error('[pokeButton] Failed to notify user about the error:', notifyError);
				LogError(notifyError, interaction, 'pokeButton notification');
			}
		}
	}
}
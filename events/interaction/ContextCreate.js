const checkPermissions = require("../../utils/checkPermissions");
const { LogError } = require("../../utils/LogError");
const { logger } = require("../../utils/logger");
const { supportinvite } = require("../../utils/support-invite");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {
    if (!interaction.isUserContextMenuCommand() && !interaction.isMessageContextMenuCommand()) return;
    const context = client.commands.context.get(interaction.commandName);
    if (!context) return;

    if (await checkPermissions("interaction", interaction, context, client)) return;

    try {
      await context.execute(interaction, client);
    } catch (error) {
      logger.error(`[Interactions] Error executing context command ${interaction.commandName}: ${error.message}`, error, LogError);
      if (interaction.replied || interaction.deferred) interaction.followUp({ content: `There was an error while executing this command! Please report this to the support server ${supportinvite}`, flags: 64 });
      else interaction.reply({ content: `There was an error while executing this command! Please report this to the support server ${supportinvite}`, flags: 64 });
    }
  },
};

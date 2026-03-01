const checkPermissions = require("../../utils/checkPermissions");
const { LogError } = require("../../utils/LogError");
const { logger } = require("../../utils/logger")
const { supportinvite } = require("../../utils/support-invite");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {
    try {
      // Determine a type string compatible with client.helpers.InteractionHandler
      let type = "other";
      if (interaction.isChatInputCommand && interaction.isChatInputCommand()) type = "commands";
      else if (interaction.isAutocomplete && interaction.isAutocomplete()) type = "commands";
      else if (interaction.isButton && interaction.isButton()) type = "buttons";
      else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) type = "selectMenus";
      else if (interaction.isModalSubmit && interaction.isModalSubmit()) type = "modals";
      else if (typeof interaction.isContextMenu === "function" && interaction.isContextMenu()) type = "commands"; // context menus currently live under commands collections in your project

      // If the centralized helper exists, delegate to it (keeps logging and handling in index.js)
      if (client.helpers && typeof client.helpers.InteractionHandler === "function") {
        return await client.helpers.InteractionHandler(interaction, type);
      }
    } catch (err) {
      // If delegation fails, fall through to local handling below
      try { logger.error("Interaction delegation failed:", err); } catch (_) {}
    }

    // Fallback: local handling (keeps original behavior if helper is missing)
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

    const command = client.commands.slash.get(interaction.commandName);
    if (!command) {
      try {
        if (interaction.isAutocomplete() && typeof interaction.respond === "function") {
          await interaction.respond([]);
        } else if (interaction.isChatInputCommand()) {
          await interaction.reply({ content: "Command not found", flags: 64 });
        }
      } catch (err) {
        return;
      }
      return;
    }

    if (await checkPermissions("interaction", interaction, command, client)) return;

    try {
      if (interaction.isAutocomplete()) {
        if (typeof command.autocomplete === "function") await command.autocomplete(interaction, client);
      } else {
        await command.execute(interaction, client);
      }
    } catch (error) {
      try {
        LogError(error, client);
      } catch (_) {}

      try {
        client.logger?.error?.(
          `[Interactions] Error executing slash command ${interaction.commandName}: ${error?.message ?? error}`,
          error
        );
      } catch (_) {}

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: `There was an error while executing this command! Please report this to the support server ${supportinvite}`, flags: 64 });
        } else {
          await interaction.reply({ content: `There was an error while executing this command! Please report this to the support server ${supportinvite}`, flags: 64 });
        }
      } catch (err) {
        return;
      }
    }
  },
};
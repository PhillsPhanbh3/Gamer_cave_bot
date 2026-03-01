const checkPermissions = require("../../utils/checkPermissions");
const { ComponentType } = require("discord.js");
const { LogError } = require("../../utils/LogError");
const { logger } = require("../../utils/logger");
const { supportinvite } = require("../../utils/support-invite");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction, client) {
    if (interaction.isButton() && interaction.isStringSelectMenu() && interaction.isModalSubmit()) return;

    let component;

    switch (true) {
      case interaction.isButton():
        component = client.components.buttons.get(interaction.customId);
        break;
      case interaction.isStringSelectMenu():
      case interaction.componentType === ComponentType.ChannelSelect:
      case interaction.componentType === ComponentType.MentionableSelect:
      case interaction.componentType === ComponentType.UserSelect:
      case interaction.componentType === ComponentType.RoleSelect:
        component = client.components.selectMenus.get(interaction.customId);
        break;
      case interaction.isModalSubmit():
      case interaction.componentType === ComponentType.TextInput:
        component = client.components.modals.get(interaction.customId);
        break;
      default:
        return;
    }

    if (!component) return;
    if (await client.helpers.checkPermissions("interaction", interaction, component, client)) return;

    try {
      await component.execute(interaction, client);
    } catch (error) {
      logger.error(`[Interactions] Error executing component ${interaction.customId}: ${error.message}`, error, LogError);
      if (interaction.replied || interaction.deferred) interaction.followUp({ content: `There was an error while executing this component! Please report this to the support server ${supportinvite}`, flags: 64 });
      else interaction.reply({ content: `There was an error while executing this component! Please report this to the support server ${supportinvite}`, flags: 64 });
    }
  },
};

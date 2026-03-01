const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

const Automod_Name_Modal = {
  customID: 'automod_name',
  async execute(interaction, client) {
    const modal = new ModalBuilder()
      .setCustomId('automod_name')
      .setTitle('Automod Name')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('automod_name_input')
            .setLabel('New Automod Name')
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setMaxLength(80)
        )
      );

    await interaction.showModal(modal);
  }
};

module.exports = { Automod_Name_Modal };
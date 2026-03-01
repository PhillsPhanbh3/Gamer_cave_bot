const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { LogError } = require("../../../../utils/LogError");
const { logger } = require("../../../../utils/logger");
const { error_emote, warning_emote, success_emote } = require("../../../../utils/emotes");
const Standardclicker = require("../../../../schema/clicker");

module.exports = {
  data: new SlashCommandBuilder().setName('clicker').setDescription('hit the button and increase the count'),
  execute: async (interaction, client) => {
    try {
      // Attempt to find and update the Standardclicker document
      const clicker = await Standardclicker.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $setOnInsert: { totalClicks: 0 } },
        { new: true, upsert: true }
      );

      if (!clicker) {
        logger.error(`[Standardclicker] Failed to create/retrieve Standardclicker document for guild: ${interaction.guild.id}`);
        LogError(error, interaction, 'Standardclicker');
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while initializing the Standardclicker. Please try again later.`);
        return await interaction.reply({ embeds: [errorEmbed], flags: 64 });
      }

      // Create the button row
      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId("Standardclicker")
          .setLabel("Click Me!")
          .setStyle(ButtonStyle.Primary)
      ]);

      // Send the reply
      await interaction.reply({
        content: `Total clicks: ${clicker.totalClicks}`,
        components: [row]
      });

      logger.info(`[Standardclicker] Successfully loaded Standardclicker for guild: ${interaction.guild.id} (${clicker.totalClicks} clicks)`);

    } catch (error) {
      logger.error(`[Standardclicker] Error in execute function:`, error);
      logger.error(`[Standardclicker] Guild ID: ${interaction.guild?.id || 'Unknown'}`);
      logger.error(`[Standardclicker] User: ${interaction.user?.tag || 'Unknown'}`);
      
      // Handle reply/followUp based on whether interaction was already replied to
      if (interaction.replied || interaction.deferred) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while processing your click. Please try again later.`);
        await interaction.followUp({ embeds: [errorEmbed], flags: 64 }).catch(err => logger.error(`[Standardclicker] Failed to send follow-up error message:`, err));
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while processing your click. Please try again later.`);
        await interaction.reply({ embeds: [errorEmbed], flags: 64 }).catch(err => logger.error(`[Standardclicker] Failed to send error reply:`, err));
      }
    }
  },
};
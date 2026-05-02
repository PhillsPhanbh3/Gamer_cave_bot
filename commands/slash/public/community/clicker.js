const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { LogError } = require("../../../../utils/LogError");
const { logger } = require("../../../../utils/logger");
const { error_emote, warning_emote, success_emote } = require("../../../../utils/emotes");
const GCBClicker = require("../../../../schema/clicker");

module.exports = {
  data: new SlashCommandBuilder().setName('clicker').setDescription('hit the button and increase the count'),
  execute: async (interaction, client) => {
    try {
      // Attempt to find and update the GCBClicker document
      const clicker = await GCBClicker.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $setOnInsert: { totalClicks: 0 } },
        { new: true, upsert: true }
      );

      if (!clicker) {
        logger.error(`[GCBClicker] Failed to create/retrieve GCBClicker document for guild: ${interaction.guild.id}`);
        LogError(error, interaction, 'GCBClicker');
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while initializing the GCBClicker. Please try again later.`);
        return await interaction.reply({ embeds: [errorEmbed], flags: 64 });
      }

      // Create the button row
      const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setCustomId("GCBClicker")
          .setLabel("Click Me!")
          .setStyle(ButtonStyle.Primary)
      ]);

      // Send the reply
      await interaction.reply({
        content: `Total clicks: ${clicker.totalClicks}`,
        components: [row]
      });

      logger.info(`[GCBClicker] Successfully loaded GCBClicker for guild: ${interaction.guild.id} (${clicker.totalClicks} clicks)`);

    } catch (error) {
      logger.error(`[GCBClicker] Error in execute function:`, error);
      logger.error(`[GCBClicker] Guild ID: ${interaction.guild?.id || 'Unknown'}`);
      logger.error(`[GCBClicker] User: ${interaction.user?.tag || 'Unknown'}`);
      
      // Handle reply/followUp based on whether interaction was already replied to
      if (interaction.replied || interaction.deferred) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while processing your click. Please try again later.`);
        await interaction.followUp({ embeds: [errorEmbed], flags: 64 }).catch(err => logger.error(`[GCBClicker] Failed to send follow-up error message:`, err));
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("An error has occurred")
          .setDescription(`${error_emote} An error occurred while processing your click. Please try again later.`);
        await interaction.reply({ embeds: [errorEmbed], flags: 64 }).catch(err => logger.error(`[GCBClicker] Failed to send error reply:`, err));
      }
    }
  },
};
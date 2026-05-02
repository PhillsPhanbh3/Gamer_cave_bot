const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require("discord.js");
const GCBClicker = require("../../../../schema/clicker");

module.exports = {
  Name: "clicker",
  Description: "hit the button and increase the count",
  permissions: {
    user: [PermissionFlagsBits.SendMessages],
    bot: [PermissionFlagsBits.ReadMessageHistory],
  },
  execute: async (interaction, client, message) => {
    
    const clicker = await GCBClicker.findOneAndUpdate({ guildId: interaction.guild.id }, { $setOnInsert: { totalClicks: 0 } }, { new: true, upsert: true });
    
    const row = new ActionRowBuilder().addComponents([new ButtonBuilder().setCustomId("GCBClicker").setLabel("Click Me!").setStyle(ButtonStyle.Primary)]);

    const sendMessage = await interaction.reply({ content: `Total clicks: ${clicker.totalClicks}`, components: [row], fetchReply: true});
    
    await sendMessage.edit({ content: `Total clicks: ${clicker.totalClicks}`, components: [row] });
  },
};
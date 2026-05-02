const GCBClicker = require("../../schema/clicker");

module.exports = {
  customId: "GCBClicker",
  cooldown: "3s",
  async execute(interaction, client) {
    //! This direct mongoDB update works for small bots but is NOT recommended for prod (use redis + mongodb for prod)
    const count = await GCBClicker.findOneAndUpdate({ guildId: interaction.guild.id }, { $inc: { totalClicks: 1 } }, { new: true, upsert: true });

    await interaction.update({ content: `Total clicks: ${count.totalClicks}`, components: interaction.message.components });
  },
};

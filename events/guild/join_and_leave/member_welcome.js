const { Events, EmbedBuilder } = require("discord.js");
const { logger } = require("../../../utils/logger");
const { LogError } = require("../../../utils/LogError");

const WELCOME_CHANNEL_ID = "1271467050833018981";

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member, client) {
    try {
      if (!member || !member.guild) return;

      // fetch the channel (in case it is not cached)
      const channel = await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
      if (!channel || !channel.isTextBased?.()) return;

      const embed = new EmbedBuilder()
        .setTitle(`Welcome to ${member.guild.name}!`)
        .setDescription(
          `Welcome ${member} to **${member.guild.name}**!\n` +
          `We're glad to have you here! Please check out the https://discord.com/channels/1173345704970833920/1195452070493433946 channel for important information and rules.\n` +
          `Please verify yourself in https://discord.com/channels/1173345704970833920/1331793346326429696 to access the rest of the server, if verification does fail please reach out to the staff team for assistance.\n` +
          `Once you verify yourself you will gain access to the rest of the server and be able to chat with everyone else!\n` +
          `And feel free to introduce yourself in https://discord.com/channels/1173345704970833920/1216435186049224734 and then check out the other channels and have fun!\n` +
          `We want to make sure you have a great experience here, so if you have any questions or need help, don't hesitate to ask the staff team or other members. Enjoy your stay!`
        )
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
        .setColor("#00FF88")
        .setTimestamp();

      await channel.send({ content: `Welcome ${member}!`, embeds: [embed] });

      logger.info(`[Welcome] ${member.user.tag} joined ${member.guild.name}`);
    } catch (error) {
      try { LogError(error, client); } catch (_) {}
      logger.error("[Welcome] Error sending welcome message:", error);
    }
  },
};
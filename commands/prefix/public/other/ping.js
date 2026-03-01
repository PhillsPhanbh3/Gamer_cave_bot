const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Replies with Pong!",
  settings: { isDeveloperOnly: false },
  permissions: {
    user: [PermissionFlagsBits.SendMessages],
    bot: [PermissionFlagsBits.ReadMessageHistory],
  },
  execute: async (message, args, client) => {
    if (message.author.bot) return;
    const sentMessage = await message.reply("Pinging...");
    const botLatency = sentMessage.createdTimestamp - message.createdTimestamp;
    const apiLatency = client.ws.ping;
    await sentMessage.edit(`Pong!\nBot Latency: ${botLatency}ms\nAPI Latency: ${apiLatency}ms`);
  },
};
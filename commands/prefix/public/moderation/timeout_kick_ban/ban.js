const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');

module.exports = {
  name: "ban",
  description: "Bans a user from the server.",
  settings: { isDeveloperOnly: false },
  permissions: {
    user: [PermissionFlagsBits.BanMembers],
    bot: [PermissionFlagsBits.BanMembers],
  },
  execute: async (message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("You do not have permission to ban members.");
    }
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("I do not have permission to ban members.");
    }

    const args = message.content.split(" ").slice(1);
    const userId = args[0];
    const reason = args.slice(1).join(" ") || "No reason given.";
    if (!userId) {
      return message.reply("Please provide a user ID to ban.");
    }

    try {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (!userId || !member) {
        logger.error("User not found for ban command:", userId);
        return message.reply("User not found.");
      }

      await member.ban({ reason });

      const banUser = await message.client.users.fetch(userId).catch(() => null);
      if (banUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription(`You have been banned from **${message.guild.name}** | ${reason}`);

        try {
          await banUser.send({ embeds: [dmEmbed] });
        } catch (err) {
          logger.error('Error sending ban DM to user:', err);
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setColor("DarkAqua")
        .setDescription(`✅ **${banUser ? banUser.tag : userId}** has been banned | ${reason}`);

      return message.reply({ embeds: [resultEmbed] });
    } catch (error) {
      logger.error("Error banning user:", error);
      LogError(error, message.client);
      return message.reply("An error occurred while trying to ban the user.");
    }
  }
};
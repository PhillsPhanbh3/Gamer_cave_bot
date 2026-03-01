const { Events, EmbedBuilder } = require('discord.js');
const { LogError } = require('../../../utils/LogError');
const { logger } = require('../../../utils/logger');

module.exports = {
  name: Events.GuildDelete,
  async execute(guild) {
    try {
      if (!guild) {
        logger.warn('GuildDelete event fired but guild is undefined');
        return;
      }

      const client = guild.client;
      const channelId = '1400215542991687722';

      let channel = null;
      try {
        channel = await client.channels.fetch(channelId);
      } catch (err) {
        channel = null;
      }

      if (!channel) {
        logger.warn('Channel not found for logging guild leave');
      }

      const embed = new EmbedBuilder()
        .setTitle('Left Guild')
        .setDescription(`I have left the guild ${guild.name ?? guild.id} with ${guild.memberCount ?? 'unknown'} members!`)
        .setColor('#FF0000')
        .setTimestamp();

      if (channel && typeof channel.send === 'function') {
        await channel.send({ embeds: [embed] });
      }

      logger.info(`Left guild ${guild.name ?? guild.id} with ${guild.memberCount ?? 'unknown'} members!`);
    } catch (error) {
      LogError(error, guild?.client);
      logger.error(error);
    }
  },
};
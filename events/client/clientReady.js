const { ActivityType } = require("discord.js");
const loadCommands = require("../../handlers/commandHandler");
const { logger } = require("../../utils/logger");

async function getServerCount(client) {
  if (client.shard) {
    try {
      const counts = await client.shard.fetchClientValues('guilds.cache.size');
      return counts.reduce((a, b) => a + b, 0);
    } catch (err) {
      return client.guilds.cache.size;
    }
  }
  return client.guilds.cache.size;
}

function buildStatuses(serverCount, apiLatency) {
  return [
    { name: 'Version 2.0', type: ActivityType.Playing },
    { name: 'Errors and dev rage', type: ActivityType.Listening },
    { name: `to PGC`, type: ActivityType.Streaming, url: 'https://www.twitch.tv/phillsphanbh3' },
    { name: `latency: API Latency: ${apiLatency}ms`, type: ActivityType.Streaming, url: 'https://www.twitch.tv/phillsphanbh3' },
  ];
}

function makeActivityObject(status) {
  const activity = { name: status.name, type: status.type };
  if (status.type === ActivityType.Streaming && status.url) {
    activity.url = status.url;
  }
  return activity;
}

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    try {
      await loadCommands(client);

      let i = 0;
      const serverCount = await getServerCount(client);

      // Compute initial latencies (rounded)
      let botLatency = Math.round(client.ws?.ping ?? 0);
      let apiLatency = Math.round(client.ws?.ping ?? 0);

      let statuses = buildStatuses(serverCount, apiLatency);

      if (client.user) {
        await client.user.setActivity(makeActivityObject(statuses[i]));
      }

      setInterval(async () => {
        i = (i + 1) % statuses.length;
        const currentCount = await getServerCount(client);

        // Recompute latencies each interval
        botLatency = Math.round(client.ws?.ping ?? 0);
        apiLatency = Math.round(client.ws?.ping ?? 0);

        statuses = buildStatuses(currentCount, botLatency, apiLatency);
        if (client.user) {
          await client.user.setActivity(makeActivityObject(statuses[i]));
        }
      }, 15000);

      const shouldLogReady = !client.shard || (Array.isArray(client.shard.ids) && client.shard.ids.includes(0));
      if (shouldLogReady) {
        client.logger?.info("[Gamer Cave Bot - Online] Gamer Cave Bot is now ready!") ?? logger.info("[Gamer Cave Bot - Online] Gamer Cave Bot is now ready!");
        client.logger?.info('[Gamer Cave Bot - Online] Hello World! This is Gamer Cave Bot version 2.0, developed by Phillsphanbh3.') ?? logger.info('[Gamer Cave Bot - Online] Hello World! This is Gamer Cave Bot version 2.0.1, developed by Phillsphanbh3.');
      }
    } catch (err) {
      client.logger?.error?.("Error in clientReady event:", err) ?? logger.error("Error in clientReady event:", err);
    }
  },
};

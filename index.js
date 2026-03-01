require("dotenv/config");
const { Client, GatewayIntentBits, Collection, Options, Events, PermissionsBitField, EmbedBuilder } = require("discord.js");
const logger = require("./utils/logger");
const loadEvents = require("./handlers/eventHandler");
const loadComponents = require("./handlers/componentHandler");
const config = require("./config/config");
const checkPermissions = require("./utils/checkPermissions");
const { connectToMongo } = require("./utils/mongo");
const { LogError } = require("./utils/LogError");
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  allowedMentions: { parse: ["users", "roles"], repliedUser: false }, //* If you need @everyone ping (not suggested) you can edit allowedMentions in .send object on TextChannel
  makeCache: Options.cacheWithLimits({ PresenceManager: 0, ReactionManager: 0, ReactionUserManager: 0 }),
});
const { error_emote, warning_emote, success_emote } = require("./utils/emotes");
const { supportinvite } = require("./utils/support-invite");
client.config = config;
client.logger = logger;
client.events = new Map();
client.commands = { slash: new Collection(), prefix: new Collection(), context: new Collection() };
client.components = { buttons: new Collection(), selectMenus: new Collection(), modals: new Collection() };
client.cooldowns = new Map();
client.helpers = { checkPermissions };
module.exports = client;

async function InteractionHandler(interaction, type) {
  // Resolve the collection where this component/command should live
  const id = interaction.customId ?? interaction.commandName;
  let collection = null;

  // Directly use client[type] if it's a Collection
  if (client[type] && typeof client[type].get === "function") {
    collection = client[type];
  } else {
    // Fallback mappings for common types
    if (type === "commands") collection = client.commands?.slash;
    else if (type === "buttons") collection = client.components?.buttons;
    else if (type === "selectMenus") collection = client.components?.selectMenus;
    else if (type === "modals") collection = client.components?.modals;
  }

  const component = collection?.get?.(id);
  if (!component) return;

  // Developer-only and blacklist pre-checks for "commands" type
  if (type === "commands") {
    try {
      if (component.devCommand) {
        const devs = Array.isArray(config.devs) ? config.devs : [];
        if (!devs.includes(interaction.user.id)) {
          return await interaction.reply({
            content: `${warning_emote} Only **DEVELOPERS** can use this command`,
            flags: 64,
          });
        }
      }

      if (typeof blacklist !== "undefined" && blacklist) {
        try {
          const data = await blacklist.findOne({ User: interaction.user.id });
          if (data) {
            return await interaction.reply({
              content: `${warning_emote} You have been **BLACKLISTED** from using this bot!\nTo appeal, join the support server linked in my bio.`,
              flags: 64,
            });
          }
        } catch (err) {
          logger.error("Error checking blacklist:", err);
        }
      }
    } catch (error) {
      logger.error("Error checking dev/blacklist preconditions:", error);
    }
  }

  try {
    // Safer, robust logging that won't throw if values are missing.
    const userTag = interaction.user?.tag ?? interaction.user?.username ?? interaction.user?.id ?? "Unknown User";
    const location = interaction.guild ? interaction.guild.name : "DMs";
    const triggerId = id ?? "unknown-id";
    const triggerType = type ?? "unknown-type";
    if (client.logger && typeof client.logger.info === "function") {
      client.logger.info(`[INTERACTION] ${userTag} in ${location} triggered ${triggerType} ${triggerId}`, {
        event: "interaction",
        type: triggerType,
        id: triggerId,
        userId: interaction.user?.id,
        guildId: interaction.guild?.id,
      });
    } else {
      logger.info(`[INTERACTION] ${userTag} in ${location} triggered ${triggerType} ${triggerId}`);
    }

    // Owner-only check (hard-coded id from your snippet)
    if (component.owner) {
      if (interaction.user.id !== "1163939796767473698")
        return await interaction.reply({ content: `${warning_emote} Only bot owners can use this command!`, flags: 64 });
    }

    // Execute the command/component
    await component.execute(interaction, client);
  } catch (error) {
    // Log locally
    logger.error(error);

    // Try to notify user (safely). Ignore known Discord races (10062, 40060).
    try {
      await interaction.deferReply({ flags: 64 }).catch(() => {});
      await interaction
        .editReply({
          content: `${error_emote} There was an error while executing this command!`,
          embeds: [],
          components: [],
          files: [],
        })
        .catch(() => {});
    } catch (replyErr) {
      const code = replyErr && replyErr.code;
      if (code === 10062 || code === 40060) {
        logger.debug?.("Ignored expected Discord API error while replying to interaction error", { code, replyErr });
        const APIErrorAlert = new EmbedBuilder()
          .setTitle("⚠️ Alert: Interaction Error Notification Failed")
          .setDescription(`${warning_emote} An error occurred while trying to notify a user about an interaction error, but it was an expected Discord API error (code ${code}). This likely means the user deleted their message or left the channel before we could reply.\n\nOriginal Interaction: ${type} ${id}\nUser: ${interaction.user?.tag ?? interaction.user?.id}\nGuild: ${interaction.guild?.name ?? "DMs"}`)
          .setColor("Yellow")
          .setTimestamp();
        await interaction.reply({ embeds: [APIErrorAlert], flags: 64 });
        logger.warn(APIErrorAlert.data.description);
      } else {
        logger.error("Failed to notify user about command error:", replyErr);
      }
    }

    try {
      LogError(error, client, `${type} ${id}`);
    } catch (e) {
      logger.error("LogError failed while reporting execution error", e);
    }
  }
}

client.helpers.InteractionHandler = InteractionHandler;

(async () => {
  try {
    await Promise.all([connectToMongo(), loadEvents(client), loadComponents(client)]);
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      logger.error("DISCORD_TOKEN environment variable is not set. Aborting startup.");
      process.exit(1);
    }
    await client.login(token);
    logger.info(`Logged in as ${client.user?.tag ?? "unknown user"}, please wait until terminal says Gamer Cave Bot is ready.`);

    try { } catch (_) {}
  } catch (error) {
    logger.error("An error occurred during startup/login", error);
  }
})();

process.on("unhandledRejection", (reason, promise) => {
  const code = reason && reason.code;

  if (code === 10062 || code === 40060 || code === 50035) {
    logger.debug?.("Ignored expected Discord API rejection", { code, reason });
    return;
  }

  logger.error("Unhandled Promise Rejection", {
    reason: reason instanceof Error ? reason.stack || reason.message : reason,
    promise,
  });

  try {
    LogError(reason, client, "unhandledRejection");
  } catch (e) {
    logger.warn("LogError failed while reporting unhandledRejection", e);
  }
});

process.on("uncaughtException", (error) => {
  if (error && error.code === "ENOMEM") {
    logger.error("Out of memory detected.", error);
  } else {
    logger.error("Uncaught Exception", error);
  } try {
    LogError(error, client, "uncaughtException");
  } catch (e) {
    logger.warn("LogError failed while reporting uncaughtException", e);
  }
});

process.on("uncaughtExceptionMonitor", (error) => {
  logger.warn("Uncaught Exception Monitor", error);
});

process.on("warning", (warning) => {
  logger.warn("Node.js Warning", warning);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    if (typeof blacklistserver !== "undefined" && blacklistserver) {
      const data = await blacklistserver.findOne({ Guild: guild.id });
      if (!data) return;
      await guild.leave();
    }
  } catch (err) {
    logger.error("Error handling GuildCreate blacklist check", { error: err, guildId: guild.id });
  }
});

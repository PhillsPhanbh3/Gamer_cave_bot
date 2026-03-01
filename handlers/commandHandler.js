const { REST, Routes } = require("discord.js");
const loadFiles = require("../utils/fileLoader");
const commandComparing = require("../utils/commandComparing");
const path = require("node:path");

module.exports = async function loadCommands(client) {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  ["prefix", "slash", "context"].map((type) => client.commands[type]?.clear());

  const [localGlobal, localDev] = [[], []];
  const syncedPrefix = [];
  const sources = [
    { type: "slash", folder: "slash", useData: true },
    { type: "context", folder: "context", useData: true },
    { type: "prefix", folder: "prefix", useData: false },
  ];

  await Promise.all(
    sources.map(async ({ type, folder, useData }) => {
      try {
        const files = await loadFiles(path.join(__dirname, "..", "commands", folder));
        if (!files.length) return client.logger.warn(`[CommandLoader] No ${type} command files found to load.`);

        await Promise.all(
          files.map(async (file) => {
            try {
              delete require.cache[require.resolve(file)];
              const cmd = require(file);
              if (!cmd || cmd.isDisabled) return;

              const name = useData ? cmd.data.name : cmd.name;
              client.commands[type]?.set(name, cmd);
              if (useData) (cmd.settings?.isDeveloperOnly ? localDev : localGlobal).push(cmd.data.toJSON());
              else syncedPrefix.push(name);
            } catch (error) {
              client.logger.error(`[CommandLoader] Failed to load ${file}: ${error.message}`);
            }
          })
        );
      } catch (error) {
        client.logger.error(`[CommandLoader] Failed to load ${folder} commands: ${error.message}`);
      }
    })
  );

  const existing = await client.application.commands.fetch({ withLocalizations: false }).then((coll) => Array.from(coll.values()).map((cmd) => Object.fromEntries(Object.entries(cmd.toJSON()).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v]))));
  const existingMap = new Map(existing.map((cmd) => [cmd.name.toLowerCase(), cmd]));

  const updated = localGlobal.map((cmd) => (existingMap.has(cmd.name.toLowerCase()) ? commandComparing(cmd, existingMap.get(cmd.name.toLowerCase())) : cmd)).filter(Boolean);
  const deleted = existing.filter((cmd) => !localGlobal.some((c) => c.name.toLowerCase() === cmd.name.toLowerCase()));

  if (updated.length || deleted.length) {
    await rest
      .put(Routes.applicationCommands(process.env.APP_ID), { body: localGlobal })
      .then(() => client.logger.info(`[CommandLoader] Successfully synced ${localGlobal.length} global command${localGlobal.length === 1 ? "" : "s"}.`))
      .catch((error) => client.logger.error(`[CommandLoader] Failed to sync global commands: ${error.message}`, error));
  }

  if (localDev.length && client.config.developerGuildId && /^(\d{17,19})$/.test(client.config.developerGuildId)) {
    await rest
      .put(Routes.applicationGuildCommands(process.env.APP_ID, client.config.developerGuildId), { body: localDev })
      .then(() => client.logger.info(`[CommandLoader] Successfully synced ${localDev.length} developer guild command${localDev.length === 1 ? "" : "s"}.`))
      .catch((error) => client.logger.error(`[CommandLoader] Failed to sync developer guild commands: ${error.message}`, error));
  }

  if (syncedPrefix.length) client.logger.info(`[CommandLoader] Loaded prefix command${syncedPrefix.length === 1 ? "" : "s"}: ${syncedPrefix.join("")}`);
};

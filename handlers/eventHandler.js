const loadFiles = require("../utils/fileLoader");
const path = require("node:path");
const { logger } = require("../utils/logger");

module.exports = async function loadEvents(client) {
  let eventCount = 0;
  client.events.clear();
  if (!client.events) client.events = new Map();

  try {
    const eventFiles = await loadFiles(path.join(__dirname, "..", "events"));

    if (eventFiles.length === 0) return logger.warn("[EventLoader] No event files found to load.");

    await Promise.all(
      eventFiles.map(async (file) => {
        const event = require(file);
        if (!event || event.isDisabled) return;

        const execute = (...args) => event.execute(...args, client);
        client.events.set(event.name, event);
        eventCount++;

        if (event.rest) event.once ? client.rest.once(event.name, execute) : client.rest.on(event.name, execute);
        else event.once ? client.once(event.name, execute) : client.on(event.name, execute);
      })
    );
  } catch (error) {
    logger.error(`[EventLoader] Error loading event files: ${error.message}`, error);
  }
};

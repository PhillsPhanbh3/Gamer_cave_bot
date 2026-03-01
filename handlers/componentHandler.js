const path = require("node:path");
const loadFiles = require("../utils/fileLoader");

module.exports = async function loadComponents(client) {
  const componentTypes = [
    { type: "buttons", folderName: "buttons" },
    { type: "selectMenus", folderName: "selectMenus" },
    { type: "modals", folderName: "modals" },
  ];

  const loadComponents = async (type, folderName) => {
    client.components[type]?.clear();

    const files = await loadFiles(path.join(__dirname, "..", "components", folderName));
    if (files.length === 0) return client.logger.warn(`[ComponentLoader] No ${type} component files found to load.`);
    let totalComponentCount = 0;

    await Promise.all(
      files.map(async (file) => {
        try {
          const component = require(file);
          if (!component || component.isDisabled) return;

          client.components[type]?.set(component.customId, component);
          totalComponentCount++;
        } catch (error) {
          client.logger.error(`[ComponentLoader] Error loading ${type} component at ${file}: ${error.message}`, error);
        }
      })
    );
    client.logger.info(`[ComponentLoader] Loaded ${totalComponentCount} ${type} components from ${folderName}`);
  };

  await Promise.all(componentTypes.map(({ type, folderName }) => loadComponents(type, folderName)));
};

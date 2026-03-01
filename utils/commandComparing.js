const { ApplicationIntegrationType, InteractionContextType } = require("discord.js");

const DEFAULT_CONTEXTS = [InteractionContextType.Guild];
const DEFAULT_INTEGRATION = [ApplicationIntegrationType.GuildInstall];

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((ei, i) => deepEqual(ei, b[i]));
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }
  return false;
}

function validateOptions(option) {
  const { name, type, description = "No description", required = false } = option;
  if (!name || typeof name !== "string") throw new Error("Option must have a vaild 'name' string");
  if (!type) throw new Error(`Option '${name}' must have a valid 'type'`);
  return { name, type, description, required };
}

function formatCommand(cmd) {
  if (!cmd.name || typeof cmd.name !== "string") throw new Error("Command must have a vaild 'name' string");

  const { name, description = "No description", options = [], defaultMemberPermissions = null, nsfw = false, contexts = DEFAULT_CONTEXTS, integrationTypes = DEFAULT_INTEGRATION, dmPermission = true } = cmd;

  return {
    name,
    description,
    defaultMemberPermissions,
    nsfw,
    dmPermission,
    developerCommand: cmd.developerCommand === true,
    contexts: Array.isArray(contexts) && contexts.length ? contexts : DEFAULT_CONTEXTS,
    integrationTypes: Array.isArray(integrationTypes) && integrationTypes.length ? integrationTypes : DEFAULT_INTEGRATION,
    options: Array.isArray(options) ? options.map(validateOptions) : [],
  };
}

module.exports = (local, existing) => {
  const formattedLocal = formatCommand(local);
  const formattedExisting = formatCommand(existing);
  if (deepEqual(formattedLocal, formattedExisting)) return null;
  return formattedLocal;
};

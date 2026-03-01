const { PermissionFlagsBits } = require("discord.js");
const parseTime = require("./timeUtils");

const formatPermissions = (permissions, hasPermission) =>
  permissions
    .filter((perm) => !hasPermission(perm))
    .map(
      (perm) =>
        `- ${Object.keys(PermissionFlagsBits)
          .find((key) => PermissionFlagsBits[key] === perm)
          .replace(/([A-Z])/g, " $1")
          .trim()}`
    )
    .join("\n");

module.exports = async function checkPermissions(type, target, command, client) {
  const { user = [], bot = [] } = command.permissions || {};
  const { isPremiumOnly, isServerOwnerOnly, isDeveloperOnly } = command.settings || {};
  const cooldownsMs = parseTime(command.cooldown || "0s");

  const cooldownKey = `${target.guild?.id}-${target.user?.id}-${command.data?.name}`;

  const userPerms = formatPermissions(user, (p) => target.member?.permissions?.has(p));
  const botPerms = formatPermissions(bot, (p) => target.guild?.members?.me?.permissions?.has(p));
  const permissionMessage = [userPerms && `You are missing permissions: ${userPerms}`, botPerms && `I (bot) am missing permissions: ${botPerms}`, isPremiumOnly && `Premium only command`, isServerOwnerOnly && target.user?.id !== target.guild?.ownerId && `Server owner only`, isDisabledCommand && `This command is disabled`, isDeveloperOnly && !client.config.developers.includes(target.user ? target.user.id : target.author?.id) && `Developer only`].filter(Boolean).join("\n");

  if (permissionMessage) return target.reply({ content: permissionMessage, flags: type === "interaction" ? 64 : undefined });

  const now = Date.now();
  if (client.cooldowns.has(cooldownKey) && client.cooldowns.get(cooldownKey) > now) return target.reply({ content: `cooldown: <t:${Math.floor(client.cooldowns.get(cooldownKey) / 1000)}:R>`, flags: 64 });
  client.cooldowns.set(cooldownKey, now + cooldownsMs);
};

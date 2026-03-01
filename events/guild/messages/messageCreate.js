const { LogError } = require("../../../utils/LogError");
const { logger } = require("../../../utils/logger");
const { supportinvite } = require("../../../utils/support-invite");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;

    require("../../../services/messages/handler")({ message, client });

    if (!message.content.startsWith(client.config.prefix)) return;
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    const command = client.commands.prefix.get(commandName) || client.commands.prefix.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    if (await client.helpers.checkPermissions("message", message, command, client)) return;

    try {
      command.execute(message, args, client);
    } catch (error) {
      logger.error(`Error executing command ${commandName}: ${error.message}`, error, LogError);
      message.reply({ content: `There was an error while executing this command! Please report this to the support server ${supportinvite}`, flags: 64 });
    }
  },
};

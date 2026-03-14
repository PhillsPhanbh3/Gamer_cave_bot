# Discord Bot Base

## Setup

1. Install Node.js, Visual Studio Code, and download the full zip file of the Gamer Cave bot

2. Install the following packages using npm install discord.js dotenv mongoose ms winston

3. Create a `.env` file in the root directory:
   ```yml
   DISCORD_TOKEN=
   APP_ID=
   MONGO_URL=
   ```
4. go into your config file, make a config.js file then put in the following
   ```module.exports = {
   prefix: "example: gcb.", - remove the example: j. and set your own custom prefix
   developerGuildId: [""], - enable discord developer mode and right click the server you want, and select copy server ID
   developers: [""], - developer IDs that you want (you and other people that speicifcally code the bot)
   errorLog: [""], - needed for logging errors, if not put in then you will unable to log errors to a specific channel
   botowner: [""], - bot owner being your user id or the person that owns the bot on discord developer portal
   };
   ```
5. Replace placeholders with actual values in both your .env file and config.js file.

### Commands (Slash, Prefix, Context)

```javascript
module.exports = {
    data: Object, // Slash Command Builder
    permissions: { bot: String[], user: String[] },
    settings: { isPremiumOnly: Boolean, isServerOwnerOnly: Boolean, isDeveloperOnly: Boolean },
    cooldown: string, // Format: "2y, 5M, 20d, 20h, 20m, 20s"
    execute: Function // For context commands (User, Message)
};
```

### Components (Buttons, Select Menus)

```javascript
module.exports = {
    customId: String, // Component Id
    permissions: { bot: String[], user: String[] },
    settings: { isPremiumOnly: Boolean, isServerOwnerOnly: Boolean, isDeveloperOnly: Boolean },
    cooldown: String // Format: "2y, 5M, 20d, 20h, 20m, 20s"
};
```

## Event Structure

```javascript
module.exports = {
  name: String, // Name of the Discord event (e.g., 'ready', 'messageCreate', 'interactionCreate')
  once: Boolean, // If true, the event will only trigger once
  execute: Function, // Function to execute when the event is triggered
};
```

## Examples

### Slash Command Example

```javascript
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!"),
  permissions: { bot: [PermissionFlagsBits.ViewMessageHistory], user: [] },
  cooldown: "5s",
  execute: async (interaction, client) => {
    await interaction.reply("Pong!");
  },
};
```

### Button Component Example

```javascript
module.exports = {
  customId: "clickMe",
  execute: async (interaction, client) => {
    await interaction.update({ content: "Button clicked!", components: [] });
  },
};
```

### Event Example (Ready)

```javascript
module.exports = {
  name: "clientReady",
  once: true,
  execute: (client) => {
    client.logger.info(`Logged in as ${client.user.username}, please wait until bot says "Ready as ${client.user.username}"!`);
  },
};
```

---

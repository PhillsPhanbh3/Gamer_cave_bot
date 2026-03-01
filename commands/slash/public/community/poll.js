const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { Logger } = require('../../../../utils/logger');
const { LogError } = require('../../../../utils/LogError');
const { supportinvite } = require('../../../../utils/support-invite');

const numberEmojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Make a poll using a very simple format!')
    .addStringOption(opt => opt
      .setName('question')
      .setDescription('The poll question')
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('option1')
      .setDescription('Option 1')
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('option2')
      .setDescription('Option 2')
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('option3')
      .setDescription('Option 3')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option4')
      .setDescription('Option 4')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option5')
      .setDescription('Option 5')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option6')
      .setDescription('Option 6')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option7')
      .setDescription('Option 7')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option8')
      .setDescription('Option 8')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option9')
      .setDescription('Option 9')
      .setRequired(false))
    .addStringOption(opt => opt
      .setName('option10')
      .setDescription('Option 10')
      .setRequired(false))
    .addRoleOption(opt => opt
      .setName('mentionrole')
      .setDescription('Mention a role in the poll embed'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    try {
      const question = interaction.options.getString('question');
      const mentionRole = interaction.options.getRole('mentionrole');

      // Gather provided options (option1..option10)
      const choices = [];
      for (let i = 1; i <= 10; i++) {
        const val = interaction.options.getString(`option${i}`);
        if (val) choices.push(val);
      }

      if (choices.length < 2) {
        return interaction.reply({ content: 'Please provide at least two options for the poll (option1 and option2).', flags: 64 });
      }

      // Build description with emoji labels
      const description = `${question}\n\n${choices.map((c, i) => `${numberEmojis[i]} ${c}`).join('\n')}`;

      const pollEmbed = new EmbedBuilder()
        .setTitle('📊 New Poll')
        .setDescription(description)
        .setColor('Blue')
        .setFooter({ text: `Poll created by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Send the poll to the channel (optional role ping)
      const pollMessage = await interaction.channel.send({
        content: mentionRole ? `${mentionRole}` : undefined,
        embeds: [pollEmbed]
      });

      // React with the corresponding number emojis
      for (let i = 0; i < choices.length; i++) {
        // make sure emoji exists in the array
        if (!numberEmojis[i]) break;
        await pollMessage.react(numberEmojis[i]);
      }

      // Acknowledge the interaction (so it doesn't time out)
      await interaction.reply({ content: 'Poll created!', flags: 64 });

    } catch (error) {
      Logger.error(`Error executing poll command: ${error}`);
      LogError(error, interaction, 'poll');
      // Ensure we reply if the interaction wasn't acknowledged yet
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: `There was an error while executing this command. Please join our support server for help: ${supportinvite}`, flags: 64 });
      } else {
        // If we already replied, optionally follow up (not necessary)
        try {
          await interaction.followUp({ content: `There was an error while executing this command. Please join our support server for help: ${supportinvite}`, flags: 64 });
        } catch {}
      }
    }
  }
};
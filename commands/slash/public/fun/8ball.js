const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Logger } = require('../../../../utils/logger');
const { LogError } = require('../../../../utils/LogError');
const { supportinvite } = require('../../../../utils/support-invite');

const responses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes — definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(opt => opt
      .setName('question')
      .setDescription('Your question for the 8-ball')
      .setRequired(true)),

  /**
   * Execute the command
   * @param {import('discord.js').CommandInteraction} interaction
   * @param {import('discord.js').Client} client
   */
  async execute(interaction, client) {
    try {
      const question = interaction.options.getString('question', true);

      // pick a random answer
      const answer = responses[Math.floor(Math.random() * responses.length)];

      const embed = new EmbedBuilder()
        .setTitle('🎱 The Magic 8-Ball')
        .addFields(
          { name: 'Question', value: question },
          { name: 'Answer', value: answer }
        )
        .setColor('Blue')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Reply publicly with the embed
      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      Logger.error(`Error executing 8ball command: ${error}`);
      LogError(error, interaction, '8ball');

      // Ensure we reply if the interaction wasn't acknowledged yet
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({ content: `There was an error while executing this command. Please join our support server for help: ${supportinvite}`, flags: 64 });
        } catch {}
      } else {
        // If we already replied, follow up (best-effort)
        try {
          await interaction.followUp({ content: `There was an error while executing this command. Please join our support server for help: ${supportinvite}`, flags: 64 });
        } catch {}
      }
    }
  }
};
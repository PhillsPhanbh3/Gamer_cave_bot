const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { LogError } = require('../../../../utils/LogError');
const { logger } = require('../../../../utils/logger');
const { supportinvite } = require('../../../../utils/support-invite');

const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? Because he was outstanding in his field!",
    "Why don't skeletons fight each other? They don't have the guts.",
    "What do you call fake spaghetti? An impasta!",
    "Why did the bicycle fall over? Because it was two-tired!",
    "What do you get when you cross a snowman and a vampire? Frostbite.",
    "Why did the math book look sad? Because it had too many problems.",
    "Why can't your nose be 12 inches long? Because then it would be a foot!",
    "What do you call cheese that isn't yours? Nacho cheese!",
    "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
    "Why did the coffee file a police report? It got mugged.",
    "Why did the tomato turn red? Because it saw the salad dressing!",
    "Why don't programmers like nature? It has too many bugs.",
    "Why do cows have hooves instead of feet? Because they lactose.",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why does the dev of Gamer Cave Bot, PhillsPhanbh3, never get lost? Because he always follows the JavaScript!",
    "Why did the cookie go to the hospital? Because he felt crummy!",
    "Why was the math lecture so long? The professor kept going off on a tangent.",
    "Why did the computer go to the doctor? Because it had a virus!",
    "Why was the broom late? It swept in!",
    "What is the same thing between MongoDB and Next.js? They both love to React!",
    "Why did the music teacher go to jail? Because she got caught with too many sharp objects!",
    "Why did the picture go to jail? Because it was framed!",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Tells you a random joke')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    async execute (interaction, client) {
        try {
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            const embed = new EmbedBuilder()
                .setTitle('Here is your joke!')
                .setDescription(randomJoke)
                .setColor('Random')
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogError(error, client, 'beta-joke', interaction);
            logger.error(error);
            await interaction.reply({ content: `An error occurred while trying to fetch a joke. Please join our support server for help: ${supportinvite}`, flags: 64 });
        }
    }
}
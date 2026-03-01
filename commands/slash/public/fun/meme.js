const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { LogError } = require('../../../../utils/LogError');
const { logger } = require('../../../../utils/logger');
const { supportinvite } = require('../../../../utils/support-invite');

const memes = [
    "I don't always test my code, but when I do, I do it in production.",
    "Brace yourselves — another 'it works on my machine' is coming.",
    "Programmer: A machine that turns coffee into code.",
    "They said 'Use the latest version' — now everything is deprecated.",
    "Git: where history is rewritten and blame is assigned.",
    "StackOverflow: Where all bugs go to rest.",
    "I would love to change the world, but they won't give me the source code.",
    "There are only two hard things in Computer Science: cache invalidation, naming things, and off-by-one errors.",
    "My code doesn't have bugs — it has undocumented features.",
    "Keep calm and blame the network.",
    "404: Motivation not found.",
    "I put the 'pro' in 'prototype'.",
    "If at first you don't succeed; call it version 1.0.",
    "When the code compiles on the first try: lies, damned lies, and unit tests.",
    "I named my dog 'Java' so I could say 'I love Java' without looking suspicious."
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Sends you a random meme')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    async execute (interaction, client) {
        try {
            const randomMeme = memes[Math.floor(Math.random() * memes.length)];
            const embed = new EmbedBuilder()
                .setTitle('Here is your meme!')
                .setDescription(randomMeme)
                .setColor('Random')
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            LogError(error, client, 'beta-meme', interaction);
            logger.error(error);
            await interaction.reply({ content: `An error occurred while trying to fetch a meme. Please join our support server for help: ${supportinvite}`, flags: 64 });
        }
    }
};
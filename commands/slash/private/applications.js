const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { LogError } = require('../../../utils/LogError');
const { logger } = require('../../../utils/logger');

//! This command was just a example for the stream but it is going to be get edited and used for the staff applications in the future. I just wanted to show how you can use embeds to provide information in a nice format.

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-staff-applications')
        .setDescription('Provides information about the application process.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction, client) {
        try {
            const embed = new EmbedBuilder()
            .setAuthor({ name: "PhillsPhanbh3 & Ziggy" })
            .setTitle("PhillsPhanbh3's gamer cave staff applications")
            .setDescription("Here is some information about the application process for our staff positions.")
            .addFields(
            { name: "How to Apply", value: "To apply for a staff position, please fill out the application form available on our website." },
            { name: "Requirements", value: "Make sure you meet all the requirements listed in the application form before applying." },
            { name: "Selection Process", value: "Our team will review all applications and contact shortlisted candidates for an interview with further questions." },
            { name: "Think you're a good fit?", value: "If you think you have what it takes to be part of our staff team, don't hesitate to apply!" }
            )
            .setColor("#0099ff").setFooter({ text: "For any questions, please contact our <@&1470186139854831822>" });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error occurred while executing applications command:', error);
            await LogError(error, interaction);
        }
    }
}
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { LogError } = require('../../../utils/LogError');
const { logger } = require('../../../utils/logger.js');
const { error_emote, warning_emote } = require('../../../utils/emotes.js');

module.exports = {
    settings: { isDeveloperOnly: true },
    data: new SlashCommandBuilder()
        .setName('dev-guild-list')
        .setDescription('Dev Command - List all servers the bot is in.'),

    async execute(interaction) {
        const GUILDS_PER_PAGE = 10;
        try {
            const guilds = Array.from(interaction.client.guilds.cache.values());

            if (guilds.length === 0) {
                return await interaction.reply({
                    content: `${warning_emote} The bot is not currently in any guilds.`,
                    flags: 64
                });
            }

            let currentPage = 0;
            const totalPages = Math.ceil(guilds.length / GUILDS_PER_PAGE);

            const generateEmbed = (page) => {
                const pageGuilds = guilds.slice(page * GUILDS_PER_PAGE, (page + 1) * GUILDS_PER_PAGE);
                return new EmbedBuilder()
                    .setColor('#c648ff')
                    .setTitle(`Guild List (Page ${page + 1}/${totalPages})`)
                    .setDescription(
                        pageGuilds.map(guild =>
                            `**${guild.name}**\n` +
                            `• ID: \`${guild.id}\`\n` +
                            `• Members: \`${guild.memberCount}\`\n` +
                            `• Owner: <@${guild.ownerId}>\n`
                        ).join('\n') || 'No guilds found'
                    )
                    .setFooter({
                        text: `Total Guilds: ${guilds.length}`,
                        iconURL: interaction.client.user.displayAvatarURL(),
                    });
            };

            const getButtons = (currentPage) => {
                return new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('◀️ Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('Next ▶️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === totalPages - 1)
                    );
            };

            const response = await interaction.reply({
                embeds: [generateEmbed(currentPage)],
                components: [getButtons(currentPage)],
                flags: 64
            });

            const collector = response.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev_page') {
                    currentPage--;
                } else if (i.customId === 'next_page') {
                    currentPage++;
                }
                await i.update({
                    embeds: [generateEmbed(currentPage)],
                    components: [getButtons(currentPage)]
                });
            });

            collector.on('end', async () => {
                try {
                    await interaction.editReply({ components: [] });
                } catch (error) { 
                    logger.error('Error removing buttons:', error); 
                    LogError(error, interaction.client, 'Dev Guild List Command - Remove Buttons');
                }
            });

        } catch (error) {
            logger.error('Error in guild-list command:', error, LogError);
            LogError(error, interaction.client, 'Dev Guild List Command');
            await interaction.reply({ content: `${error_emote} An error occurred while executing this command, check the logs for more details.`, flags: 64 });
        }
    }
};

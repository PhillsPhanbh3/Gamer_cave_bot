const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserBlacklist = require('../../../schema/blacklist_user.js');
const { LogError } = require('../../../utils/LogError.js');
const { logger } = require('../../../utils/logger.js');
const { error_emote, warning_emote, success_emote } = require('../../../utils/emotes.js');

module.exports = {
    settings: { isDeveloperOnly: true },
    data: new SlashCommandBuilder()
        .setName('dev-blacklist-user')
        .setDescription('Blacklist a user from using this bot')
        .addStringOption(option => option.setName('action').setDescription('User options').addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }).setRequired(true))
        .addUserOption(option => option.setName('user').setDescription('The user to blacklist').setRequired(true)),
    async execute (interaction, client) {
        const { options } = interaction;
        const user = options.getUser('user');
        const action = options.getString('action');

        // User ID validation (basic check)
        if (!/^\d{17,19}$/.test(user.id)) {
            logger.warn(`Invalid user ID provided: ${user.id}`);
            return await interaction.reply({
                content: `${error_emote} Invalid user ID, please check user ID.`,
                flags: 64,
            });
        }

        try {
            const data = await UserBlacklist.findOne({ User: user.id });

            if (action === 'add') {
                if (data) {
                    // User is already blacklisted
                    logger.info(`User ${user.tag} (${user.id}) is already blacklisted`);
                    return await interaction.reply({
                        content: `${warning_emote} The user \`${user.tag}\` is already blacklisted.`,
                        flags: 64
                    });
                }

                // Add user to blacklist
                await UserBlacklist.create({ User: user.id });
                logger.info(`User ${user.tag} (${user.id}) added to blacklist by ${interaction.user.tag}`);

                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${success_emote} The user \`${user.tag}\` has been blacklisted from using any commands on this bot`);

                return await interaction.reply({ embeds: [embed], flags: 64 });

            } else if (action === 'remove') {
                if (!data) {
                    // User is not blacklisted
                    logger.info(`Attempted to remove non-blacklisted user: ${user.tag} (${user.id})`);
                    return await interaction.reply({
                        content: `${warning_emote} The user \`${user.tag}\` is not currently blacklisted.`,
                        flags: 64
                    });
                }

                // Remove user from blacklist
                await UserBlacklist.deleteOne({ User: user.id });
                logger.info(`User ${user.tag} (${user.id}) removed from blacklist by ${interaction.user.tag}`);

                const embed = new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(`${success_emote} The user \`${user.tag}\` has been removed from the blacklist and can now use the bot commands again.`);

                return await interaction.reply({ embeds: [embed], flags: 64 });
            }

        } catch (error) {
            logger.error('Error managing user blacklist:', error);
            LogError(error, interaction.client, 'Dev Blacklist User Command');

            // Check if we've already replied
            if (interaction.replied || interaction.deferred) {
                return await interaction.followUp({
                    content: `${error_emote} An error occurred while processing your request. Please try again later.`,
                    flags: 64
                }).catch(err => logger.error('Failed to send error follow-up:', err));
            } else {
                return await interaction.reply({
                    content: `${error_emote} An error occurred while processing your request. Please try again later.`,
                    flags: 64
                }).catch(err => logger.error('Failed to send error reply:', err));
            }
        }
    }
};
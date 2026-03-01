const { EmbedBuilder, ChannelType } = require('discord.js');
const { logger } = require('./logger');

/**
 * Logs an error to a specific Discord forum thread
 * @param {Error|string} error - The error to log
 * @param {import('discord.js').Client} client - The Discord client
 * @param {string} context - Context of the error
 */
async function LogError(error, client, context = 'Unknown Context') {
    const forumChannelId = '1372726179005595759'; // forum channel (optional check)
    const threadId = '1400571521465843863';       // thread to post into

    if (!client?.channels) {
        logger.error('Client or client.channels is null. Unable to fetch thread.');
        return;
    }

    try {
        const thread = await client.channels.fetch(threadId).catch(() => null);

        if (!thread) {
            logger.error(`Could not fetch thread (${threadId}) for error logging!`);
            return;
        }

        // Basic safety checks
        if (thread.type !== ChannelType.PublicThread && thread.type !== ChannelType.PrivateThread) {
            logger.error(`Fetched channel (${threadId}) is not a thread. Got type: ${thread.type}`);
            return;
        }

        // Optional: verify it belongs to the expected forum channel
        if (forumChannelId && thread.parentId !== forumChannelId) {
            logger.error(
                `Thread (${threadId}) parentId mismatch. Expected ${forumChannelId}, got ${thread.parentId}`
            );
            // You can return here if you want to enforce it:
            // return;
        }

        // If archived/locked, try to reopen (requires permissions)
        if (thread.archived) await thread.setArchived(false, 'Re-opening error log thread');
        if (thread.locked) await thread.setLocked(false, 'Unlocking error log thread');

        const errorEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ Error Detected ⚠️')
            .setDescription(`\`\`\`js\n${error?.stack || error}\n\`\`\``)
            .addFields(
                { name: 'Context', value: context },
                { name: 'Timestamp', value: new Date().toISOString() },
                { name: 'Client User', value: client.user ? `<@${client.user.id}>` : 'Unknown' }
            )
            .setTimestamp();

        await thread.send({ embeds: [errorEmbed] });
    } catch (sendError) {
        logger.error('Failed to send error to logging thread:', sendError);
    }
}

module.exports = { LogError };
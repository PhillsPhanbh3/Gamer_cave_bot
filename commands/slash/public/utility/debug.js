const { SlashCommandBuilder, EmbedBuilder, version: discordJsVersion, PermissionsBitField } = require('discord.js');
const process = require('process');
const { logger } = require('../../../../utils/logger');
const { LogError } = require('../../../../utils/LogError');
const { error_emote } = require('../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('debug')
        .setDescription('Check bot performance, latency, and memory usage.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewChannel),
        async execute(interaction) {
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferReply({ });
            }

            const ping = Date.now() - interaction.createdTimestamp;
            const memoryUsage = process.memoryUsage();
            const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
            const heapMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);

            const embed = new EmbedBuilder()
                .setTitle('📊 Bot Debug Info')
                .setColor('Blurple')
                .addFields(
                    { name: 'API Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: 'Response Time', value: `${ping}ms`, inline: true },
                    { name: 'Guilds Served', value: `${interaction.client.guilds.cache.size}`, inline: true },
                    { name: 'Memory (RSS)', value: `${rssMB} MB`, inline: true },
                    { name: 'Memory (Heap Used)', value: `${heapMB} MB`, inline: true },
                    { name: 'Discord.js Version', value: discordJsVersion, inline: true },
                    { name: 'Shard ID', value: `${interaction.guild?.shardId ?? 'N/A'}`, inline: true }
                )
                .setFooter({ text: 'If you experience lag, report this data to the support team.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            if (err && err.code === 10062) return;
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `An error occurred while running the command. The developers have been notified.`, flags: 64 });
                    logger.error(`[Stable Debug] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
                    LogError(err, interaction, 'commands/slash/public/utility/debug.js');
                } else {
                    await interaction.followUp({ content: `An error occurred while running the command. The developers have been notified.`, flags: 64 });
                    logger.error(`[Stable Debug] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
                    LogError(err, interaction, 'commands/slash/public/utility/debug.js');
                }
            } catch (Err) {
                logger.error(`[Stable Debug] Secondary error while handling an error for ${interaction.user.tag}: ${Err?.message ?? Err}`, Err);
                // If we can't even send an error message, there's not much else we can do, so we just log it and move on.
            }
        }
    }
};
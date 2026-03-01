const { SlashCommandBuilder, EmbedBuilder, version: discordJsVersion, PermissionsBitField } = require('discord.js');
const process = require('process');
const { lastUpdate } = require('../../../../utils/update-info');
const { logger } = require('../../../../utils/logger');
const { LogError } = require('../../../../utils/LogError');
const { supportinvite } = require('../../../../utils/support-invite');
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
                    { name: 'Shard ID', value: `${interaction.guild?.shardId ?? 'N/A'}`, inline: true },
                    { name: 'Last Update', value: `${lastUpdate.date} at ${lastUpdate.time}\n${lastUpdate.description}`, inline: false }
                )
                .setFooter({ text: 'If you experience lag, report this data to the support team.' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (err) {
            if (err && err.code === 10062) return;
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `${error_emote} An error occurred while running the command. Please report this to the support server ${supportinvite}`, flags: 64 });
                    logger.error(`[Stable Debug] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
                    LogError(err, interaction, 'commands/slash/public/utility/debug.js');
                } else {
                    await interaction.followUp({ content: `${error_emote} An error occurred while running the command. Please report this to the support server ${supportinvite}`, flags: 64 });
                    logger.error(`[Stable Debug] Error executing command for ${interaction.user.tag}: ${err?.message ?? err}`, err);
                    LogError(err, interaction, 'commands/slash/public/utility/debug.js');
                }
            } catch (Err) {
                return;
            }
        }
    }
};
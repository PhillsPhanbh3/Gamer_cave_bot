const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const ReportSystemModule = require('../../../../../schema/report_system');
const Reportsystem =
    ReportSystemModule?.Reportsystem ||
    ReportSystemModule?.Reportsystem ||
    ReportSystemModule?.default ||
    ReportSystemModule;
const { error_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report-setup')
        .setDescription('Setup the report system for the server')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('The channel where reports will be logged')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        )
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('The role to mention when a report is made')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(interaction, client) {
        const contextPrefix = `[Beta-report-setup][guild=${interaction.guild?.id ?? 'unknown'}][chan=${interaction.channel?.id ?? 'unknown'}][executor=${interaction.user?.id ?? 'unknown'}]`;

        const safeReply = async (payload) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.followUp(payload);
                }
                return await interaction.reply(payload);
            } catch (e) {
                logger.error(`${contextPrefix} Failed to send reply/followUp: ${e?.message ?? e}`);
                try {
                    LogError(e, client, 'Report Setup Command - reply failure', interaction);
                } catch (_) {}
            }
        };

        try {
            if (!Reportsystem || typeof Reportsystem.findOneAndUpdate !== 'function') {
                logger.error(`${contextPrefix} Report model is undefined or invalid. Check schema/report_system export and DB initialization.`);
                await safeReply({
                    content: `${error_emote} Internal configuration error: report model is not available. Please verify the server's database setup and module exports.`,
                    flags: 64,
                });
                return;
            }

            const logChannel = interaction.options.getChannel('channel');
            const mentionRole = interaction.options.getRole('role');

            if (!logChannel || logChannel.guildId !== interaction.guild.id || !logChannel.isTextBased()) {
                logger.warn(`${contextPrefix} Invalid log channel selected. channelId=${logChannel?.id ?? 'none'} type=${logChannel?.type ?? 'unknown'}`);
                return await safeReply({
                    content: `${error_emote} Please select a text channel in this server for logging reports.`,
                    flags: 64,
                });
            }

            const me = interaction.guild.members.me;
            const perms = logChannel.permissionsFor(me);
            if (!perms?.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
                logger.warn(`${contextPrefix} Missing permissions in channel ${logChannel.id}. Required: SendMessages & EmbedLinks`);
                return await safeReply({
                    content: `${error_emote} I don't have permission to send messages and embeds in <#${logChannel.id}>. Please adjust channel permissions and try again.`,
                    flags: 64,
                });
            }

            const reportSetup = await Reportsystem.findOneAndUpdate(
                { GuildId: interaction.guild.id },
                {
                    GuildId: interaction.guild.id,
                    ChannelId: logChannel.id,
                    RoleId: mentionRole ? mentionRole.id : null,
                },
                { upsert: true, new: true }
            );

            const setupEmbed = new EmbedBuilder()
                .setTitle('Report System Setup')
                .setDescription(`${success_emote} The report system has been successfully set up for this server.`)
                .setColor('#00FF00')
                .addFields(
                    { name: 'Log Channel', value: `<#${logChannel.id}>`, inline: true },
                    { name: 'Mention Role', value: mentionRole ? `<@&${mentionRole.id}>` : 'None', inline: true },
                    { name: 'Setup By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                    { name: 'Record ID', value: `${reportSetup?._id ?? 'unknown'}`, inline: true },
                    { name: 'Guild ID', value: `${interaction.guild.id}`, inline: true }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [setupEmbed] });

            logger.info(`${contextPrefix} Report system configured. channel=${logChannel.id} role=${mentionRole?.id ?? 'none'} recordId=${reportSetup?._id ?? 'unknown'}`);

            await safeReply({
                content: `${success_emote} Report system configured. Details posted in <#${logChannel.id}>.`,
                flags: 64,
            });
        } catch (error) {
            logger.error(`${contextPrefix} Error setting up report system: ${error?.message ?? error}`);
            try {
                LogError(error, client, 'Report Setup Command', interaction);
            } catch (_) {}
            await safeReply({
                content: `${error_emote} There was an error setting up the report system.`,
                flags: 64,
            });
        }
    }
};
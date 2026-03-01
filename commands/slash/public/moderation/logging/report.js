const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const ReportSystemModule = require('../../../../../schema/report_system');
const Reportsystem =
    ReportSystemModule?.Reportsystem ||
    ReportSystemModule?.Reportsystem ||
    ReportSystemModule?.default ||
    ReportSystemModule;

const { error_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a user to the moderators')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user you would like to report')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for reporting the user')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewChannel),

    async execute(interaction, client) {
        const contextPrefix = `[Beta-report][guild=${interaction.guild?.id ?? 'unknown'}][chan=${interaction.channel?.id ?? 'unknown'}][executor=${interaction.user?.id ?? 'unknown'}]`;

        const safeReply = async (payload) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.followUp(payload);
                }
                return await interaction.reply(payload);
            } catch (e) {
                client?.logger?.error?.(`${contextPrefix} Failed to send reply/followUp: ${e?.message ?? e}`);
                try { LogError?.(e, client, 'Beta Report - reply failure', interaction); } catch (_) {}
            }
        };

        try {
            // Validate model availability
            if (!Reportsystem || typeof Reportsystem.findOne !== 'function') {
                client?.logger?.error?.(`${contextPrefix} Report model is undefined or invalid. Check schema/report_system export and DB initialization.`);
                return await safeReply({
                    content: `${error_emote} Internal configuration error: report model is not available. Ask an admin to run setup or check the database connection.`,
                    flags: 64,
                });
            }

            const targetUser = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason')?.trim();

            if (!reason) {
                return await safeReply({
                    content: `${error_emote} Please provide a reason for the report.`,
                    flags: 64,
                });
            }

            // Fetch report system configuration
            const config = await Reportsystem.findOne({ GuildId: interaction.guild.id }).lean().exec();
            if (!config?.ChannelId) {
                client?.logger?.warn?.(`${contextPrefix} No report log channel configured for guild.`);
                return await safeReply({
                    content: `${error_emote} No report log channel is configured for this server. Ask an admin to run /Beta-report-setup.`,
                    flags: 64,
                });
            }

            // Resolve channel
            let reportChannel;
            try {
                reportChannel = await client.channels.fetch(config.ChannelId);
            } catch (fetchErr) {
                client?.logger?.error?.(`${contextPrefix} Failed to fetch channel ${config.ChannelId}: ${fetchErr?.message ?? fetchErr}`);
                try { LogError?.(fetchErr, client, 'Beta Report - channel fetch', interaction); } catch (_) {}
                return await safeReply({
                    content: `${error_emote} Failed to reach the report channel. Please verify the configured channel still exists.`,
                    flags: 64,
                });
            }

            // Permission check
            const me = reportChannel.guild?.members?.me;
            const perms = reportChannel.permissionsFor(me);
            if (!perms?.has(['SendMessages', 'EmbedLinks'])) {
                client?.logger?.warn?.(`${contextPrefix} Missing SendMessages or EmbedLinks in channel ${reportChannel.id}`);
                return await safeReply({
                    content: `${error_emote} I lack permissions to send messages/embeds in the report channel.`,
                    flags: 64,
                });
            }

            // Build report embed
            const reportEmbed = new EmbedBuilder()
                .setTitle('New User Report')
                .setColor('#FF0000')
                .addFields(
                    { name: 'Reported User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Reported By', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setTimestamp();

            // Mention the configured role if present
            const content = config.RoleId ? `<@&${config.RoleId}>` : undefined;

            await reportChannel.send({ content, embeds: [reportEmbed] });

            client?.logger?.info?.(`${contextPrefix} Report delivered to channel=${reportChannel.id} role=${config.RoleId ?? 'none'} target=${targetUser.id}`);

            await safeReply({
                content: `${success_emote} Your report has been submitted and delivered to the staff team of ${interaction.guild.name}.`,
                flags: 64,
            });
        } catch (error) {
            client?.logger?.error?.(`${contextPrefix} Error while executing /Beta-report: ${error?.message ?? error}`);
            try { LogError?.(error, client, 'Beta Report Command', interaction); } catch (_) {}

            await safeReply({
                content: `${error_emote} An error occurred while submitting your report.`,
                flags: 64,
            });
        }
    }
}
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user in the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user you would like to warn')
                .setRequired(true),
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for warning the user'),
        ),

    async execute(interaction, client) {
        const contextPrefix = `[Beta-warn][guild=${interaction.guild?.id ?? 'unknown'}][chan=${interaction.channel?.id ?? 'unknown'}][executor=${interaction.user?.id ?? 'unknown'}]`;

        const safeReply = async (payload) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.followUp(payload);
                }
                return await interaction.reply(payload);
            } catch (e) {
                logger.error(`${contextPrefix} Failed to send reply/followUp: ${e?.message ?? e}`);
                LogError(e, interaction, 'Beta-warn');
            }
        };

        try {
            const warnUser = interaction.options.getUser('target');

            if (!interaction.member?.permissions?.has(PermissionsBitField.Flags.KickMembers)) {
                logger.warn(`${contextPrefix} Missing permission KickMembers. executor=${interaction.user?.tag}`);
                return await safeReply({
                    content: `${warning_emote} You can't execute this command because you don't have the **KICK MEMBERS** permission!`,
                    flags: 64,
                });
            }

            let warnMember = null;
            try {
                warnMember = await interaction.guild.members.fetch(warnUser.id);
            } catch (fetchErr) {
                logger.error(`${contextPrefix} Failed to fetch member target=${warnUser?.id}: ${fetchErr?.message ?? fetchErr}`);
                LogError(fetchErr, interaction, 'Beta-warn');
            }

            if (!warnMember) {
                logger.warn(`${contextPrefix} Target not in guild or fetch failed. target=${warnUser?.id}`);
                return await safeReply({
                    content: `${warning_emote} The user mentioned is not in the server`,
                    flags: 64,
                });
            }

            let reason = interaction.options.getString('reason');
            if (!reason) reason = 'No reason given.';

            const dmEmbed = new EmbedBuilder()
                .setColor('DarkOrange')
                .setDescription(`${warning_emote} You have been warned in the server **${interaction.guild.name}** | ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('Navy')
                .setDescription(`${success_emote} ${warnUser.tag} has been **warned** | ${reason}`);
            try {
                await warnMember.send({ embeds: [dmEmbed] });
            } catch (dmErr) {
                logger.warn(`${contextPrefix} Failed to DM target=${warnUser?.id} (${warnUser?.tag}): ${dmErr?.message ?? dmErr}`);
                LogError(dmErr, interaction, 'Beta-warn');
            }

            await safeReply({ embeds: [embed] });

            logger.info(`${contextPrefix} Warned target=${warnUser?.id} (${warnUser?.tag}) reason="${reason}" by executor=${interaction.user?.tag}`);
        } catch (err) {
            logger.error(`${contextPrefix} Unexpected error: ${err?.message ?? err}`);
            LogError(err, interaction, 'Beta-warn');

            await safeReply({
                content: `${error_emote} An unexpected error occurred while processing this command. If this keeps happening, please reach out via our support: ${supportinvite}`,
                flags: 64,
            });
        }
    },
};
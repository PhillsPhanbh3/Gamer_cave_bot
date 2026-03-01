const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { LogError } = require('../../../../../utils/LogError');
const { logger } = require('../../../../../utils/logger');
const { supportinvite } = require('../../../../../utils/support-invite');
const { error_emote, warning_emote, success_emote } = require('../../../../../utils/emotes');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn-remove')
        .setDescription('Remove a warning from a user in the server')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('The user whose warning you want to remove')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for removing the warning')
        ),

    async execute(interaction, client) {
        const contextPrefix = `[beta-warn-remove][guild=${interaction.guild?.id ?? 'unknown'}][chan=${interaction.channel?.id ?? 'unknown'}][executor=${interaction.user?.id ?? 'unknown'}]`;

        const safeReply = async (payload) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    return await interaction.followUp(payload);
                }
                return await interaction.reply(payload);
            } catch (e) {
                logger.error(`${contextPrefix} Failed to send reply/followUp: ${e?.message ?? e}`);
                LogError(e, interaction, 'beta-warn-remove');
            }
        };

        try {
            const targetUser = interaction.options.getUser('target');

            if (!interaction.member?.permissions?.has(PermissionsBitField.Flags.KickMembers)) {
                logger.warn(`${contextPrefix} Missing permission KickMembers. executor=${interaction.user?.tag}`);
                return await safeReply({
                    content: `${warning_emote} You can't execute this command because you don't have the **KICK MEMBERS** permission!`,
                    flags: 64,
                });
            }

            let targetMember = null;
            try {
                targetMember = await interaction.guild.members.fetch(targetUser.id);
            } catch (fetchErr) {
                logger.error(`${contextPrefix} Failed to fetch member target=${targetUser?.id}: ${fetchErr?.message ?? fetchErr}`);
                LogError(fetchErr, interaction, 'beta-warn-remove');
            }

            if (!targetMember) {
                logger.warn(`${contextPrefix} Target not in guild or fetch failed. target=${targetUser?.id}`);
                return await safeReply({
                    content: `${warning_emote} The user mentioned is not in the server`,
                    flags: 64,
                });
            }

            let reason = interaction.options.getString('reason');
            if (!reason) reason = 'No reason given.';

            const dmEmbed = new EmbedBuilder()
                .setColor('DarkGreen')
                .setDescription(`${success_emote} Your warning in **${interaction.guild.name}** has been removed | ${reason}`);

            const embed = new EmbedBuilder()
                .setColor('Navy')
                .setDescription(`${success_emote} ${targetUser.tag} had their warning **removed** | ${reason}`);

            try {
                await targetMember.send({ embeds: [dmEmbed] });
            } catch (dmErr) {
                logger.warn(`${contextPrefix} Failed to DM target=${targetUser?.id} (${targetUser?.tag}) about warn removal: ${dmErr?.message ?? dmErr}`);
                try { LogError(dmErr, interaction, 'Beta-warn-remove'); } catch (_) {}
            }

            await safeReply({ embeds: [embed] });

            logger.info(`${contextPrefix} Removed warning for target=${targetUser?.id} (${targetUser?.tag}) reason="${reason}" by executor=${interaction.user?.tag}`);
        } catch (err) {
            logger.error(`${contextPrefix} Unexpected error: ${err?.message ?? err}`);
            LogError(err, interaction, 'Beta-warn-remove');

            await safeReply({
                content: `${error_emote} An unexpected error occurred while processing this command. If this keeps happening, please reach out via our support: ${supportinvite}`,
                flags: 64,
            });
        }
    },
};
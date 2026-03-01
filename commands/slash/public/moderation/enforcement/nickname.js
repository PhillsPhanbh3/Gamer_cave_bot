const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { logger } = require('../../../../../utils/logger');
const { LogError } = require("../../../../../utils/LogError");
const { error_emote, success_emote } = require("../../../../../utils/emotes");
const { supportinvite } = require("../../../../../utils/support-invite");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Change the nickname of a user in the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption(option => option.setName('target').setDescription('The user to change the nickname for').setRequired(true))
        .addStringOption(option => option.setName('nickname').setDescription('The new nickname for the user').setRequired(true)),
    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('target');
        const newNickname = interaction.options.getString('nickname');
        const guild = interaction.guild;
        try {
            const member = await guild.members.fetch(targetUser.id);
            await member.setNickname(newNickname, `Nickname changed by ${interaction.user.tag} using Gamer Cave Bot`);

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('Nickname Changed')
                .setDescription(`${success_emote} Successfully changed nickname of ${targetUser.tag} to **${newNickname}**.`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(`[Nickname Command] Error changing nickname for ${targetUser.tag} in guild ${guild.id}: ${error?.message ?? error}`);
            LogError(error, interaction, 'commands/slash/public/moderation/enforcement/nickname.js');
            await interaction.reply({ content: `${error_emote} An error occurred while trying to change the nickname. Please ensure I have the proper permissions and the target user's highest role is below mine. If the issue persists, join our support server: ${supportinvite}`, flags: 64 });
        }
    }
}
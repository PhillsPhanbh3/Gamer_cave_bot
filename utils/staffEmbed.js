const { EmbedBuilder } = require('discord.js');
const { Online_emote, Idle_emote, DND_emote, Offline_emote } = require('./emotes');

const EMOTES = {
    online: Online_emote,
    idle: Idle_emote,
    dnd: DND_emote,
    offline: Offline_emote,
};

/**
 * Generates a staff embed showing online status categories
 * NOTE: If Presence Intent is missing, member.presence will be undefined.
 * We treat that as "offline" by default, but also show a hint in the embed footer.
 * @param {Array<import('discord.js').GuildMember>} staffMembers
 * @returns {EmbedBuilder}
 */
function generateStaffEmbed(staffMembers) {
    const categories = {
        online: [],
        idle: [],
        dnd: [],
        offline: [],
    };

    let missingPresenceCount = 0;

    staffMembers.forEach(member => {
        const mention = `<@${member.id}>`;

        // presence can be null/undefined if Presence intent isn't enabled
        const status = member.presence?.status;
        if (!status) missingPresenceCount++;

        switch (status) {
            case 'online':
                categories.online.push(mention);
                break;
            case 'idle':
                categories.idle.push(mention);
                break;
            case 'dnd':
                categories.dnd.push(mention);
                break;
            default:
                // Use mentions here (consistent) instead of tags/ids
                categories.offline.push(mention);
                break;
        }
    });

    // Sort members alphabetically in each category (mentions sort by id; that's OK but stable)
    for (const key in categories) {
        categories[key].sort((a, b) => a.localeCompare(b));
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
        .setTitle('👥 Staff Availability')
        .setColor(0x00AE86)
        .addFields(
            { name: `${EMOTES.online} Online`, value: categories.online.join('\n') || 'None', inline: true },
            { name: `${EMOTES.idle} Idle`, value: categories.idle.join('\n') || 'None', inline: true },
            { name: `${EMOTES.dnd} Do Not Disturb`, value: categories.dnd.join('\n') || 'None', inline: true },
            { name: `${EMOTES.offline} Offline`, value: categories.offline.join('\n') || 'None', inline: true },
            { name: 'Total Staff', value: `${staffMembers.length}`, inline: true },
            { name: 'Last Updated', value: `<t:${timestamp}:F>`, inline: true }
        )
        .setTimestamp();

    if (missingPresenceCount > 0) {
        embed.setFooter({
            text: `Presence missing for ${missingPresenceCount}/${staffMembers.length}. If everyone looks offline, enable Presence Intent (GuildPresences) in code + Developer Portal.`
        });
    }

    return embed;
}

module.exports = { generateStaffEmbed };
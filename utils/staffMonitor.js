const fs = require('fs');
const path = require('path');
const { generateStaffEmbed } = require('./staffEmbed');
const messagePath = path.join(__dirname, '../data/staffMessage.json');
const {LogError} = require('./LogError');
const staffRoleId = '1334687755241787423';
const staffChannelId = '1305711589231562803';
const { logger } = require('./logger');

const FULL_FETCH_COOLDOWN_MS = 5 * 60 * 1000;
const EVENT_DEBOUNCE_MS = 1000;

const lastFullFetchAt = new Map();
const fullFetchPromises = new Map();
const pendingUpdateTimeouts = new Map();

function loadMessageData() {
    try {
        if (!fs.existsSync(messagePath)) fs.writeFileSync(messagePath, JSON.stringify([], null, 2));
        const raw = fs.readFileSync(messagePath, 'utf8');
        return raw.trim() ? JSON.parse(raw) : [];
    } catch (error) {
        LogError(error, 'Load Staff Message Data');
        logger.error('Failed to load staffMessage.json, resetting...', error);
        fs.writeFileSync(messagePath, JSON.stringify([], null, 2));
        return [];
    }
}

function saveMessageData(data) {
    fs.writeFileSync(messagePath, JSON.stringify(data, null, 2));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeGuildMemberFetch(guild, guildId) {
    if (fullFetchPromises.has(guildId)) {
        return fullFetchPromises.get(guildId);
    }

    const doFetch = async () => {
        try {
            await guild.members.fetch(); // may trigger gateway member chunk (opcode 8)
            lastFullFetchAt.set(guildId, Date.now());
        } catch (err) {
            // If Discord returned a gateway rate-limit, respect the retry_after and wait.
            if (err?.data?.retry_after) {
                const waitMs = Math.ceil(err.data.retry_after * 1000);
                logger.warn(`[Staff Embed] Gateway rate limited for guild ${guildId}, retry_after ${waitMs}ms`);
                await sleep(waitMs);
                // single retry after waiting; on repeated failures we bubble up
                await guild.members.fetch();
                lastFullFetchAt.set(guildId, Date.now());
            } else {
                throw err;
            }
        } finally {
            // cleanup promise entry (if present)
            fullFetchPromises.delete(guildId);
        }
    };

    const p = doFetch();
    fullFetchPromises.set(guildId, p);
    return p;
}

/**
 * Updates the staff embed
 * @param {Client} client 
 * @param {boolean} forced - true if triggered by force command
 */
async function updateStaffEmbed(client, forced = false) {
    try {
        const guild = client.guilds.cache.first();
        if (!guild) return;

        const staffRole = guild.roles.cache.get(staffRoleId);
        const staffChannel = guild.channels.cache.get(staffChannelId);
        if (!staffRole || !staffChannel) return;

        // Decide whether to perform a full guild.members.fetch():
        const guildId = guild.id;
        const now = Date.now();
        const lastFetch = lastFullFetchAt.get(guildId) || 0;
        const cacheEmpty = staffRole.members.size === 0;

        if ((forced || cacheEmpty) && (now - lastFetch) > FULL_FETCH_COOLDOWN_MS) {
            try {
                await safeGuildMemberFetch(guild, guildId);
            } catch (err) {
                LogError(err, client, 'Staff Embed - fetch members');
                logger.error('Failed to fetch guild members for staff embed:', err);
                // proceed using whatever is in cache (even if stale) to avoid blocking the embed entirely
            }
        }

        const staffMembers = Array.from(staffRole.members.values());
        const embed = generateStaffEmbed(staffMembers);

        const data = loadMessageData();
        let record = data.find(r => r.guildId === guild.id && r.channelId === staffChannel.id);

        if (record?.messageId) {
            const msg = await staffChannel.messages.fetch(record.messageId).catch(() => null);
            if (msg) {
                await msg.edit({ embeds: [embed] });
                return;
            }
        }

        // If no valid message, send a new one
        const msg = await staffChannel.send({ embeds: [embed] });
        if (record) {
            record.messageId = msg.id;
        } else {
            data.push({
                guildId: guild.id,
                channelId: staffChannel.id,
                messageId: msg.id
            });
        }
        saveMessageData(data);

    } catch (error) {
        LogError(error, client);
        logger.error('❌ Error updating staff embed:', error);
    }
}

function scheduleUpdate(guildId, client, forced = false) {
    // Coalesce multiple events into a single update per guild
    if (pendingUpdateTimeouts.has(guildId)) {
        clearTimeout(pendingUpdateTimeouts.get(guildId));
    }

    const t = setTimeout(() => {
        pendingUpdateTimeouts.delete(guildId);
        updateStaffEmbed(client, forced).catch(err => {
            LogError(err, client, 'Scheduled Staff Embed Update');
        });
    }, EVENT_DEBOUNCE_MS);

    pendingUpdateTimeouts.set(guildId, t);
}

function startStaffMonitor(client) {
    updateStaffEmbed(client).catch(err => LogError(err, client, 'Initial Staff Embed Update'));

    setInterval(() => updateStaffEmbed(client), 30_000);

    const onMemberAdd = (member) => {
        try {
            if (member.guild?.id !== client.guilds.cache.first()?.id) return;
            if (member.roles?.cache?.has(staffRoleId)) {
                scheduleUpdate(member.guild.id, client);
            }
        } catch (err) { LogError(err, client, 'onMemberAdd'); }
    };

    const onMemberRemove = (member) => {
        try {
                if (member.guild?.id !== client.guilds.cache.first()?.id) return;
            if (member.roles?.cache?.has(staffRoleId)) {
                scheduleUpdate(member.guild.id, client);
            }
        } catch (err) { LogError(err, client, 'onMemberRemove'); }
    };

    const onMemberUpdate = (oldMember, newMember) => {
        try {
            if (newMember.guild?.id !== client.guilds.cache.first()?.id) return;
            const had = oldMember.roles?.cache?.has(staffRoleId);
            const has = newMember.roles?.cache?.has(staffRoleId);
            if (had !== has) {
                scheduleUpdate(newMember.guild.id, client);
            }
        } catch (err) { LogError(err, client, 'onMemberUpdate'); }
    };

    client.on('guildMemberAdd', onMemberAdd);
    client.on('guildMemberRemove', onMemberRemove);
    client.on('guildMemberUpdate', onMemberUpdate);

    return function stop() {
        client.off('guildMemberAdd', onMemberAdd);
        client.off('guildMemberRemove', onMemberRemove);
        client.off('guildMemberUpdate', onMemberUpdate);
    };
}

module.exports = { startStaffMonitor, updateStaffEmbed };
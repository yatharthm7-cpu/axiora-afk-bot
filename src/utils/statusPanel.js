const { EmbedBuilder } = require('discord.js');
const BotManager = require('../botManager');
const User = require('../models/User');

let statusInterval = null;

/**
 * Formats process uptime into readable Days, Hours, Minutes, Seconds.
 */
function getUptimeString() {
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
}

async function updateStatusPanel(client) {
    const channelId = process.env.STATUS_CHANNEL_ID;
    if (!channelId) return;

    try {
        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        // Fetch Metrics
        const activeBotCount = BotManager.getAllBots().size;
        const totalUsersCount = await User.countDocuments({});
        const uptime = getUptimeString();

        const statusEmbed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('🌐 Axiora AFK System Status')
            .setDescription('Live infrastructure metrics and service health.')
            .addFields(
                { name: '🟢 Service Status', value: '`ONLINE`', inline: true },
                { name: '🤖 Active Bots', value: `\`${activeBotCount}\``, inline: true },
                { name: '👥 Total Users', value: `\`${totalUsersCount}\``, inline: true },
                { name: '⏱️ System Uptime', value: `\`${uptime}\``, inline: true },
                { name: '⚡ Host Node', value: '`Pterodactyl Node 01`', inline: true },
                { name: '🎮 Target Server', value: '`play.fatalmc.org`', inline: true }
            )
            .setFooter({ text: 'Updates automatically every 30 seconds' })
            .setTimestamp();

        let messageId = process.env.STATUS_MESSAGE_ID;
        let message = null;

        // Try to fetch existing message if ID is present
        if (messageId) {
            message = await channel.messages.fetch(messageId).catch(() => null);
        }

        if (message) {
            // Edit existing panel
            await message.edit({ embeds: [statusEmbed] });
        } else {
            // Send new panel and log the message ID
            const newMsg = await channel.send({ embeds: [statusEmbed] });
            console.log(`\n📌 [STATUS PANEL] New status embed created!`);
            console.log(`Add this ID to your .env file as STATUS_MESSAGE_ID=${newMsg.id}\n`);
        }

    } catch (error) {
        console.error('[STATUS PANEL] Failed to update status panel:', error);
    }
}

function startStatusPanel(client) {
    // Run initial update immediately upon boot
    updateStatusPanel(client);

    // Update every 30 seconds (30,000 ms) to comfortably stay clear of Discord rate limits
    if (!statusInterval) {
        statusInterval = setInterval(() => updateStatusPanel(client), 30000);
    }
}

module.exports = startStatusPanel;
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Shows a live overview of active bots and system resources'),

    async execute(interaction) {
        // 1. Gather Bot Data
        const bots = BotManager.getAllBots();
        const botCount = bots.size;
        
        // Grab usernames and truncate if it exceeds Discord's 1024-character embed limit
        let botList = Array.from(bots.keys()).join(', ');
        if (botList.length > 1000) {
            botList = botList.substring(0, 995) + '...';
        }
        if (botCount === 0) botList = 'No bots currently online.';

        // 2. Calculate RAM usage in Megabytes
        const memoryData = process.memoryUsage();
        const ramUsageMb = (memoryData.rss / 1024 / 1024).toFixed(2);
        
        // 3. Calculate Node.js Process Uptime
        const totalSeconds = process.uptime();
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds / 3600) % 24;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const uptimeStr = `${days}d ${hours}h ${minutes}m`;

        // 4. Build the Visual Embed Dashboard
        const statusEmbed = new EmbedBuilder()
            .setTitle('📊 Pterodactyl Node Status')
            .setColor('#2b2d31') // Blends nicely with Discord's dark theme
            .addFields(
                { name: '🤖 Active Bots', value: `\`${botCount}\` online`, inline: true },
                { name: '💾 Memory Usage', value: `\`${ramUsageMb} MB\``, inline: true },
                { name: '⏱️ Node Uptime', value: `\`${uptimeStr}\``, inline: true },
                { name: '📋 Bot List', value: `\`\`\`text\n${botList}\n\`\`\``, inline: false }
            )
            .setTimestamp();

        // We make this reply public (no MessageFlags.Ephemeral) so your whole admin team can see it
        await interaction.reply({ embeds: [statusEmbed] });
    }
};
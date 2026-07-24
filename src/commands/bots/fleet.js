const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fleet')
        .setDescription('View the status, health, and location of all active bots'),

    async execute(interaction) {
        const activeBots = BotManager.getAllBots(); // Returns the Map of active bots

        if (activeBots.size === 0) {
            return interaction.reply({ 
                content: '⚠️ There are currently no active bots in the fleet.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🌐 Fleet Status Dashboard')
            .setDescription(`Currently monitoring **${activeBots.size}** active bot(s).`)
            .setTimestamp();

        let count = 0;

        // Loop through each active bot in the Map
        for (const [username, bot] of activeBots.entries()) {
            // Discord limits embeds to 25 fields max
            if (count >= 25) {
                embed.setFooter({ text: `...and ${activeBots.size - 25} more bots hidden due to Discord limits.` });
                break;
            }

            // Determine current status
            let currentAction = '🟢 Idle';
            if (bot.isPatrolling) currentAction = '🚶 Patrolling';
            else if (bot.pathfinder?.isMoving()) currentAction = '🏃 Moving to target';

            // Fetch live stats
            const health = bot.health ? Math.round(bot.health) : '?';
            const food = bot.food ? Math.round(bot.food) : '?';
            const ping = bot.player?.ping || 0;
            const position = BotManager.getFormattedPosition(bot);

            // Add the bot's data as a field in the embed
            embed.addFields({
                name: `🤖 ${username}`,
                value: `**Action:** ${currentAction} | **Ping:** ${ping}ms\n**Vitals:** ❤️ ${health}/20 | 🍖 ${food}/20\n**Location:** \`${position}\``,
                inline: false // Keeps each bot on its own row for readability
            });

            count++;
        }

        await interaction.reply({ embeds: [embed] });
    }
};
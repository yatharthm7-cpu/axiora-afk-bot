const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-all')
        .setDescription('Safely disconnects every active bot on the node'),

    async execute(interaction) {
        // Defer the reply immediately to prevent the 10062 Unknown Interaction crash
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const activeBots = BotManager.getAllBots();
        const botCount = activeBots.size;

        if (botCount === 0) {
            return interaction.editReply({ 
                content: '⚠️ No bots are currently online.'
            });
        }

        // Iterate through the Map of active bots and shut them down
        for (const [username, bot] of activeBots.entries()) {
            bot.manualDisconnect = true; // Prevent the auto-reconnect loop
            bot.quit();
        }

        // Edit the deferred reply with the final success message
        await interaction.editReply({ 
            content: `🛑 **Success:** Disconnected \`${botCount}\` bots safely. Auto-reconnect disabled for all.`
        });
    }
};
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say-all')
        .setDescription('Make every active bot send the same message in-game')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message or command (e.g. /spawn) to broadcast')
                .setRequired(true)
                .setMaxLength(256) // Minecraft's standard chat character limit
        ),

    async execute(interaction) {
        const message = interaction.options.getString('message');
        const activeBots = BotManager.getAllBots();
        const botCount = activeBots.size;

        if (botCount === 0) {
            return interaction.reply({ 
                content: '⚠️ No bots are currently online to send the message.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        let successCount = 0;

        // Iterate through the Map of active bots
        for (const [username, bot] of activeBots.entries()) {
            // Only send if the bot is actually spawned in the world
            if (bot && bot.entity) {
                bot.chat(message);
                successCount++;
            }
        }

        await interaction.reply({ 
            content: `📢 **Broadcast Complete!**\n\`${successCount}/${botCount}\` bots successfully said: \`${message}\``, 
            flags: MessageFlags.Ephemeral 
        });
    }
};
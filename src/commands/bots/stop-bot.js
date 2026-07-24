const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-bot')
        .setDescription('Safely disconnect an active bot without deleting its data')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The username of the active bot to stop')
                .setRequired(true)
                .setAutocomplete(true)
        ),
        
    // Autocomplete pulling from ACTIVE bots only
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        
        // Get all currently running bots from the Map
        const activeBots = Array.from(BotManager.getAllBots().keys());
        
        // Filter based on what the user is typing
        const filtered = activeBots
            .filter(username => username.toLowerCase().includes(focusedValue))
            .slice(0, 25); // Discord limits autocomplete to 25 choices
        
        await interaction.respond(
            filtered.map(username => ({ name: username, value: username }))
        );
    },

    async execute(interaction) {
        const username = interaction.options.getString('username');
        const bot = BotManager.getBot(username);

        if (!bot) {
            return interaction.reply({ 
                content: `⚠️ Bot \`${username}\` is not currently running.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Flag the bot so it doesn't trigger the auto-reconnect loop
        bot.manualDisconnect = true; 
        
        // Safely end the connection to the Minecraft server
        bot.quit();

        await interaction.reply({ 
            content: `🛑 **Success:** \`${username}\` has been disconnected safely. Auto-reconnect is disabled.`, 
            flags: MessageFlags.Ephemeral 
        });
    }
};
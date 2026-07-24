const { SlashCommandBuilder, MessageFlags } = require('discord.js');
// IMPORTANT: Update this path to point to your actual Mongoose Account model!
const Account = require('../../models/Account'); 
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-account')
        .setDescription('Permanently delete a Minecraft account from the database')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The username of the account to remove')
                .setRequired(true)
                .setAutocomplete(true)
        ),
        
    // Autocomplete to easily find accounts in the database
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        // Search the DB for usernames matching what the user typed
        const accounts = await Account.find({ 
            minecraftUsername: new RegExp(focusedValue, 'i') 
        }).limit(25);
        
        await interaction.respond(
            accounts.map(acc => ({ name: acc.minecraftUsername, value: acc.minecraftUsername }))
        );
    },

    async execute(interaction) {
        const username = interaction.options.getString('username');

        // 1. Delete from MongoDB
        const deletedAccount = await Account.findOneAndDelete({ minecraftUsername: username });
        
        if (!deletedAccount) {
            return interaction.reply({ 
                content: `⚠️ Account \`${username}\` was not found in the database.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        // 2. Kill the bot if it is currently running
        const activeBot = BotManager.getBot(username);
        if (activeBot) {
            activeBot.manualDisconnect = true; // Prevents the auto-reconnect loop
            activeBot.quit();
        }

        await interaction.reply({ 
            content: `🗑️ **Success:** Account \`${username}\` has been deleted from the database and disconnected.`, 
            flags: MessageFlags.Ephemeral 
        });
    }
};
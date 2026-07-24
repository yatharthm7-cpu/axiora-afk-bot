const { SlashCommandBuilder, MessageFlags } = require('discord.js');
// IMPORTANT: Update this path to point to your actual Mongoose Account model!
const Account = require('../../models/Account'); 
const BotManager = require('../../botManager');

// Helper function to create a delay (prevents CPU spikes and anti-bot kicks)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start-all')
        .setDescription('Boots up all saved accounts in the database with a safe login delay'),

    async execute(interaction) {
        // Defer reply because starting multiple bots takes time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const accounts = await Account.find({});
            
            if (accounts.length === 0) {
                return interaction.editReply({ content: '⚠️ No accounts found in the database.' });
            }

            const activeBots = BotManager.getAllBots();
            let startedCount = 0;
            let alreadyRunningCount = 0;

            await interaction.editReply({ 
                content: `⏳ **Booting Sequence Initiated**\nAttempting to start \`${accounts.length}\` bots. Please wait...` 
            });

            for (const account of accounts) {
                // Skip if the bot is already running
                if (activeBots.has(account.minecraftUsername)) {
                    alreadyRunningCount++;
                    continue;
                }

                // Spawn the bot
                BotManager.spawnBot(account, interaction.client);
                startedCount++;

                // Wait 3 seconds before starting the next bot to save CPU and avoid rate limits
                await sleep(3000);
            }

            await interaction.editReply({ 
                content: `✅ **Fleet Deployment Complete**\nStarted: \`${startedCount}\`\nAlready Running: \`${alreadyRunningCount}\`` 
            });

        } catch (error) {
            console.error('Start-all error:', error);
            await interaction.editReply({ content: `⚠️ Error starting fleet: ${error.message}` });
        }
    }
};
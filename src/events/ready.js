const { Events } = require('discord.js');
const Account = require('../models/Account');
const BotManager = require('../botManager');
const startExpiryCron = require('../utils/expiryCron');
const startStatusPanel = require('../utils/statusPanel'); // ⬅️ Import status panel

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ Logged in as ${client.user.tag}!`);

        // --- START BACKGROUND SERVICES ---
        startExpiryCron(client);
        console.log('⏰ Expiry Cron Job initialized.');

        startStatusPanel(client);
        console.log('📊 Status Panel loop initialized.');

        // --- AUTO-RESPAWN FLEET ON BOOT VIA QUEUE ---
        try {
            const savedBots = await Account.find({ autoReconnect: true });
            
            if (savedBots.length > 0) {
                console.log(`🔄 Found ${savedBots.length} saved bots. Initiating fleet deployment...`);
                for (const accountData of savedBots) {
                    BotManager.queueSpawn(accountData, client);
                }
            } else {
                console.log('💤 No active bots found in database. Standing by.');
            }
        } catch (error) {
            console.error('[CRASH RECOVERY] Failed to fetch database records:', error);
        }
    },
};
const cron = require('node-cron');
const User = require('../models/User'); // Adjust path to your User database model
const Account = require('../models/Account'); // Adjust path to your Account model
const BotManager = require('../botManager'); 
const { EmbedBuilder } = require('discord.js');

function startExpiryCron(client) {
    // This cron expression '0 * * * *' runs exactly at minute 0 of every hour.
    // (e.g., 1:00 PM, 2:00 PM, 3:00 PM)
    cron.schedule('0 * * * *', async () => {
        console.log('⏳ [CRON] Running automated subscription expiry check...');

        try {
            const now = new Date();
            
            // Find all users whose subscription date has passed, but who still have slots
            const expiredUsers = await User.find({
                expiresAt: { $lte: now },
                maxBots: { $gt: 0 }
            });

            if (expiredUsers.length === 0) {
                return;
            }

            console.log(`[CRON] Found ${expiredUsers.length} expired subscriptions. Processing...`);

            for (const user of expiredUsers) {
                // 1. Find and despawn all active bots owned by this user
                const userAccounts = await Account.find({ discordUserId: user.discordId });
                
                for (const account of userAccounts) {
                    const bot = BotManager.getBot(account.minecraftUsername);
                    if (bot) {
                        bot.manualDisconnect = true;
                        bot.quit(); // Safely triggers the disconnect event, cleans up channels, and drops DB records
                    }
                }

                // 2. Revoke their slots in the database
                user.maxBots = 0;
                user.activeBots = 0;
                await user.save();

                // 3. Notify the user via DM
                try {
                    const discordUser = await client.users.fetch(user.discordId);
                    if (discordUser) {
                        const expireEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('⚠️ Subscription Expired')
                            .setDescription(`Your **Axiora AFK** subscription has ended and your bot slots have been revoked.\n\nAny active bots were safely disconnected. To renew your plan, please open a ticket in our server!`)
                            .setTimestamp();

                        await discordUser.send({ embeds: [expireEmbed] }).catch(() => {});
                    }
                } catch (dmError) {
                    // Ignore error if user left the server or has DMs closed
                }

                console.log(`[CRON] Revoked access for user ID: ${user.discordId}`);
            }

        } catch (error) {
            console.error('[CRON] Error checking subscriptions:', error);
        }
    });
}

module.exports = startExpiryCron;
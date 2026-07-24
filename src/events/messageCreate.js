const { Events } = require('discord.js');
const BotManager = require('../botManager');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(message, client) {
        if (message.author.bot) return;

        // --- DYNAMIC 2-WAY CHAT BRIDGE ---
        const activeBots = Array.from(BotManager.getAllBots().values());
        const linkedBot = activeBots.find(bot => bot.discordChannelId === message.channel.id);

        if (linkedBot && linkedBot.entity) {
            linkedBot.chat(message.content);
            message.react('✅').catch(() => {});
        }
    },
};
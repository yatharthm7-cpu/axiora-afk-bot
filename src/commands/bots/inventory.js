const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Check the inventory of a connected bot')
        .addStringOption(option => option.setName('username').setDescription('The Minecraft username').setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString('username');
        const bot = BotManager.getBot(username);

        if (!bot) {
            return interaction.reply({ content: '⚠️ Bot is not currently online.', flags: MessageFlags.Ephemeral });
        }

        const items = bot.inventory.items();
        const itemList = items.length > 0 
            ? items.map(item => `${item.count}x ${item.name}`).join('\n')
            : 'Inventory is empty';

        await interaction.reply({ content: `**${username}'s Inventory:**\n\`\`\`\n${itemList}\n\`\`\``, flags: MessageFlags.Ephemeral });
    },
};
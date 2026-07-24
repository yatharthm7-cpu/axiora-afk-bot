const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Execute a Minecraft command as a specific bot')
        .addStringOption(option => option.setName('username').setDescription('The Minecraft username').setRequired(true))
        .addStringOption(option => option.setName('command').setDescription('Command without the slash (e.g. login pass123)').setRequired(true)),
    async execute(interaction) {
        const username = interaction.options.getString('username');
        const cmd = interaction.options.getString('command');
        const bot = BotManager.getBot(username);

        if (!bot) {
            return interaction.reply({ content: `⚠️ Bot \`${username}\` is not online.`, flags: MessageFlags.Ephemeral });
        }

        bot.chat(`/${cmd}`);
        await interaction.reply({ content: `✅ Executed \`/${cmd}\` as \`${username}\`.`, flags: MessageFlags.Ephemeral });
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Send an announcement to all active bot dashboard channels.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message to broadcast')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const messageText = interaction.options.getString('message');
        const activeBots = BotManager.getAllBots();

        if (activeBots.size === 0) {
            return interaction.editReply({ content: '⚠️ No active bots are currently connected.' });
        }

        // Collect unique Discord channel IDs from running bots
        const channelIds = new Set();
        for (const [, bot] of activeBots) {
            if (bot.discordChannelId) {
                channelIds.add(bot.discordChannelId);
            }
        }

        if (channelIds.size === 0) {
            return interaction.editReply({ content: '⚠️ No active dashboard channels were found.' });
        }

        const broadcastEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('📢 System Announcement')
            .setDescription(messageText)
            .setFooter({ text: `Sent by ${interaction.user.username}` })
            .setTimestamp();

        let successCount = 0;
        let failCount = 0;

        for (const channelId of channelIds) {
            try {
                const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
                if (channel) {
                    await channel.send({ embeds: [broadcastEmbed] });
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                failCount++;
            }
        }

        await interaction.editReply({
            content: `✅ Broadcast delivered to **${successCount}** channels. (${failCount} failed)`
        });
    },
};
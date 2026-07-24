const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Open the control dashboard for your bots')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('Specific bot username (leave blank to show ALL active bots)')
                .setRequired(false) // Changed to false so users can just type /panel
        ),
        
    async execute(interaction) {
        const targetUsername = interaction.options.getString('username');
        const activeBots = BotManager.getAllBots();

        if (activeBots.size === 0) {
            return interaction.reply({ 
                content: '⚠️ No bots are currently online.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        // Determine which bots to display
        let botsToDisplay = [];
        
        if (targetUsername && targetUsername.toLowerCase() !== 'all') {
            const bot = BotManager.getBot(targetUsername);
            if (!bot) {
                return interaction.reply({ 
                    content: `<:alert:1529748338260443266> Bot \`${targetUsername}\` is not currently online.`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
            botsToDisplay.push({ username: targetUsername, bot });
        } else {
            // If no username was provided (or they typed "all"), grab all of them
            for (const [username, bot] of activeBots.entries()) {
                botsToDisplay.push({ username, bot });
            }
        }

        // Defer the reply so we have time to generate and send multiple panels if needed
        await interaction.deferReply(); 

        // Loop through and send a panel for each targeted bot
        for (let i = 0; i < botsToDisplay.length; i++) {
            const { username, bot } = botsToDisplay[i];
            const currentPosition = BotManager.getFormattedPosition(bot);

            const panelEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`🎮 Control Panel: ${username}`)
                .setDescription(`Manage your AFK bot directly from this dashboard.\n\n<:location:1529747048100925582> **Location:** \`${currentPosition}\``)
                .addFields(
                    { name: 'Health', value: `<:health:1529747052458938479> ${bot.health || 20}/20`, inline: true },
                    { name: 'Food', value: `<:food:1529747050357587989> ${bot.food || 20}/20`, inline: true },
                    { name: 'Ping', value: `<:ping:1529747054547435631> ${bot.player?.ping || 0}ms`, inline: true }
                )
                .setTimestamp();

            // EMOJI FIX: Separated the label text and the custom emoji IDs
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`inv_${username}`)
                    .setLabel('Inventory')
                    .setEmoji('1529747944356577350')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`drop_${username}`)
                    .setLabel('Drop All')
                    .setEmoji('1529747942104236162')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`chunk_${username}`)
                    .setLabel('Chunk View')
                    .setEmoji('1529747937985298463')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`refresh_${username}`)
                    .setLabel('Refresh')
                    .setEmoji('1529747946546004008')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`dc_${username}`)
                    .setLabel('Disconnect')
                    .setEmoji('1529747939914813460')
                    .setStyle(ButtonStyle.Danger)
            );

            // Edit the initial deferred reply for the first bot, send follow-ups for the rest
            if (i === 0) {
                await interaction.editReply({ embeds: [panelEmbed], components: [actionRow] });
            } else {
                await interaction.followUp({ embeds: [panelEmbed], components: [actionRow] });
            }
        }
    }
};
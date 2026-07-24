const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const BotManager = require('../../botManager');
const Account = require('../../models/Account');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('despawn')
        .setDescription('Disconnect and remove your AFK bot.')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The Minecraft username of the bot to despawn')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        const username = interaction.options.getString('username');
        const discordUserId = interaction.user.id;

        try {
            // 1. Database Ownership Check
            const account = await Account.findOne({ minecraftUsername: username });
            
            if (!account) {
                return interaction.editReply(`❌ No database record found for \`${username}\`.`);
            }
            
            // Allow the owner OR a Server Administrator to despawn the bot
            const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
            if (account.discordUserId !== discordUserId && !isAdmin) {
                return interaction.editReply(`🚫 **Access Denied:** You do not own the bot \`${username}\`.`);
            }

            // 2. Fetch Active Bot
            const bot = BotManager.getBot(username);
            
            if (!bot) {
                // If the bot isn't online but is stuck in the DB, clean it up
                await Account.findOneAndDelete({ minecraftUsername: username });
                return interaction.editReply(`⚠️ \`${username}\` is not currently online, but its database record has been cleared so you can spawn a new one.`);
            }

            // 3. Trigger Disconnect Sequence
            bot.manualDisconnect = true;
            bot.quit(); // This triggers the 'end' event in BotManager which deletes the channel and frees the DB slot

            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('🛑 Despawn Initiated')
                .setDescription(`✅ Successfully sent the disconnect signal to \`${username}\`.\n\nThe bot will log off and the channel will be deleted shortly.`)
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Despawn Command Error:', error);
            await interaction.editReply(`❌ An error occurred while trying to despawn: ${error.message}`);
        }
    }
};
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const BotManager = require('../../botManager');
const Account = require('../../models/Account');
// const User = require('../../models/User'); // Uncomment this if you have a separate User model for subscription limits!

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spawn')
        .setDescription('Spawn a new Minecraft bot and save its configuration.')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The Minecraft username for the bot')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('server_ip')
                .setDescription('The server IP and port (e.g. play.server.com:25565)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('password')
                .setDescription('Password for auto-login/register (Cracked servers only)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('auth')
                .setDescription('Authentication type')
                .addChoices(
                    { name: 'Offline (Cracked)', value: 'offline' },
                    { name: 'Microsoft (Premium)', value: 'microsoft' }
                )
                .setRequired(false)),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const username = interaction.options.getString('username');
        const serverIp = interaction.options.getString('server_ip');
        const password = interaction.options.getString('password');
        const authType = interaction.options.getString('auth') || 'offline';
        const discordUserId = interaction.user.id;

        // 1. Memory Duplicate Check
        if (BotManager.getBot(username)) {
            return interaction.editReply(`⚠️ **${username}** is already actively running!`);
        }

        try {
            // 2. Anti-Steal Check
            const existingAccount = await Account.findOne({ minecraftUsername: username });
            if (existingAccount && existingAccount.discordUserId !== discordUserId) {
                return interaction.editReply(`🚫 **Access Denied:** The username \`${username}\` is already registered to another user.`);
            }

            // 3. Subscription Limit Check (Example Logic)
            // const userLimits = await User.findOne({ discordId: discordUserId });
            // const activeBotsCount = await Account.countDocuments({ discordUserId: discordUserId });
            // if (!userLimits || activeBotsCount >= userLimits.maxBots) {
            //     return interaction.editReply(`⚠️ **Limit Reached:** You cannot spawn any more bots. Please upgrade your plan!`);
            // }

            // 4. Update or Create Configuration
            const accountData = await Account.findOneAndUpdate(
                { minecraftUsername: username },
                {
                    discordUserId: discordUserId,
                    authType: authType,
                    serverIp: serverIp,
                    loginPassword: password || null, 
                    autoReconnect: true
                },
                { upsert: true, new: true }
            );

            BotManager.spawnBot(accountData, client);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🚀 Deployment Initiated')
                .setDescription(`Spawning **${username}** into \`${serverIp}\`...\n\n*If a password was provided, the bot will automatically authenticate upon joining.*`)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Spawn Command Error:', error);
            await interaction.editReply(`❌ Database error while trying to spawn: ${error.message}`);
        }
    }
};
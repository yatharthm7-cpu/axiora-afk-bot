const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Account = require('../../models/Account'); // Adjust path as needed
const User = require('../../models/User'); // ⬅️ Added User model import

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-proxy')
        .setDescription('Assign a custom proxy to your AFK bot to prevent IP bans.')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The Minecraft username of the bot')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('proxy')
                .setDescription('Format: IP:Port, IP:Port:User:Pass, or socks5://...')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const username = interaction.options.getString('username');
        const proxyString = interaction.options.getString('proxy');

        try {
            // --- 1. FEATURE GATE (THE UPSELL) ---
            const userRecord = await User.findOne({ discordId: interaction.user.id });
            
            // If they have no plan, or are on a lower-tier plan, block them.
            if (!userRecord || ['Free', 'Starter', 'Member'].includes(userRecord.planName)) {
                return interaction.editReply('❌ **Premium Feature:** You must upgrade to the **Premium** or **Faction** plan to use custom proxies and avoid IP bans!\n*Open a ticket to upgrade your plan.*');
            }

            // --- 2. VERIFY OWNERSHIP ---
            const account = await Account.findOne({ minecraftUsername: username });
            
            if (!account) {
                return interaction.editReply(`❌ No bot found with the username \`${username}\`.`);
            }

            if (account.discordUserId !== interaction.user.id && !interaction.member.permissions.has('Administrator')) {
                return interaction.editReply(`❌ You do not own this bot account.`);
            }

            // --- 3. PARSE THE PROXY STRING ---
            let proxyType = 'http';
            let host, port, proxyUser, proxyPass;

            if (proxyString.includes('://')) {
                const parsedUrl = new URL(proxyString);
                proxyType = parsedUrl.protocol.replace(':', '');
                host = parsedUrl.hostname;
                port = parsedUrl.port;
                proxyUser = decodeURIComponent(parsedUrl.username || '');
                proxyPass = decodeURIComponent(parsedUrl.password || '');
            } 
            else {
                const parts = proxyString.split(':');
                if (parts.length < 2) {
                    return interaction.editReply('❌ Invalid proxy format. Use `IP:PORT` or `IP:PORT:USER:PASS`.');
                }
                host = parts[0];
                port = parts[1];
                if (parts.length === 4) {
                    proxyUser = parts[2];
                    proxyPass = parts[3];
                }
            }

            if (!host || !port || isNaN(port)) {
                return interaction.editReply('❌ Failed to parse proxy port. Ensure the format is correct.');
            }

            // --- 4. SAVE TO DATABASE ---
            account.proxy = {
                enabled: true,
                type: proxyType.toLowerCase() === 'socks5' ? 'socks5' : 'http',
                host: host,
                port: Number(port),
                username: proxyUser || '',
                password: proxyPass || ''
            };

            await account.save();

            // --- 5. SEND CONFIRMATION ---
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🛡️ Proxy Configured Successfully')
                .setDescription(`A proxy has been attached to **${username}**.\n\n*Note: If the bot is currently online, you must despawn and respawn it for the proxy to take effect.*`)
                .addFields(
                    { name: 'Host:Port', value: `\`${host}:${port}\``, inline: true },
                    { name: 'Protocol', value: `\`${account.proxy.type.toUpperCase()}\``, inline: true },
                    { name: 'Auth', value: proxyUser ? '✅ Yes' : '❌ No', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error setting proxy:', error);
            await interaction.editReply('❌ An error occurred while saving your proxy configuration.');
        }
    },
};
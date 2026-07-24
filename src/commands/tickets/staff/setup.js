const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Check or configure the ticket system environment')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const staffRoleId = process.env.STAFF_ROLE_ID;
        const categoryId = process.env.TICKET_CATEGORY_ID;
        
        let setupStatus = '';
        let missingConfigs = false;

        // 1. Check Staff Role
        if (staffRoleId && interaction.guild.roles.cache.has(staffRoleId)) {
            setupStatus += `✅ **Staff Role:** Configured (<@&${staffRoleId}>)\n`;
        } else {
            setupStatus += `❌ **Staff Role:** Missing or Invalid in \`.env\` (\`STAFF_ROLE_ID\`)\n`;
            missingConfigs = true;
        }

        // 2. Check Ticket Category
        let categoryChannel = categoryId ? interaction.guild.channels.cache.get(categoryId) : null;
        
        if (categoryChannel && categoryChannel.type === ChannelType.GuildCategory) {
            setupStatus += `✅ **Ticket Category:** Configured (\`${categoryChannel.name}\`)\n`;
        } else {
            // Automatically create the category if it doesn't exist
            try {
                categoryChannel = await interaction.guild.channels.create({
                    name: '🎫 Active Tickets',
                    type: ChannelType.GuildCategory,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel], // Hidden from normal members by default
                        }
                    ]
                });
                setupStatus += `⚠️ **Ticket Category:** Was missing, but I just created it! \n👉 **Action Required:** Add \`TICKET_CATEGORY_ID=${categoryChannel.id}\` to your \`.env\` file and restart the bot.\n`;
                missingConfigs = true;
            } catch (err) {
                setupStatus += `❌ **Ticket Category:** Missing, and I lack permissions to create it.\n`;
                missingConfigs = true;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🛠️ Ticket System Setup Status')
            .setColor(missingConfigs ? '#FFA500' : '#00FF00')
            .setDescription(setupStatus)
            .setFooter({ text: missingConfigs ? 'Please update your .env file with the missing IDs.' : 'All systems go! You are ready to deploy the /panel.' });

        await interaction.editReply({ embeds: [embed] });
    }
};
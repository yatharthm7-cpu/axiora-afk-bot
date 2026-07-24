const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim this ticket for yourself')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.channel.name.includes('-')) {
            return interaction.reply({ content: 'This command can only be used inside a ticket!', ephemeral: true });
        }

        const staffRoleId = process.env.STAFF_ROLE_ID;
        
        if (!staffRoleId) {
            return interaction.reply({ content: '⚠️ `STAFF_ROLE_ID` is not defined in the .env file. Cannot manage staff permissions.', ephemeral: true });
        }

        // Deny all other staff from sending messages
        await interaction.channel.permissionOverwrites.edit(staffRoleId, {
            SendMessages: false
        });

        // Ensure the claiming staff member retains their permissions
        await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true
        });

        const claimEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`✋ This ticket has been claimed by ${interaction.user}. They will be assisting you shortly.`);

        await interaction.reply({ embeds: [claimEmbed] });
    }
};
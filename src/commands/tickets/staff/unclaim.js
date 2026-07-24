const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unclaim')
        .setDescription('Unclaim this ticket so other staff can assist')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (!interaction.channel.name.includes('-')) {
            return interaction.reply({ content: 'This command can only be used inside a ticket!', ephemeral: true });
        }

        const staffRoleId = process.env.STAFF_ROLE_ID;

        if (!staffRoleId) {
            return interaction.reply({ content: '⚠️ `STAFF_ROLE_ID` is not defined in the .env file. Cannot manage staff permissions.', ephemeral: true });
        }

        // Restore default staff permissions by setting SendMessages back to neutral/true
        await interaction.channel.permissionOverwrites.edit(staffRoleId, {
            SendMessages: null 
        });

        // Remove the specific override for the staff member who claimed it
        await interaction.channel.permissionOverwrites.delete(interaction.user.id).catch(() => {});

        const unclaimEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setDescription(`🔓 This ticket has been unclaimed by ${interaction.user} and is now open to all staff.`);

        await interaction.reply({ embeds: [unclaimEmbed] });
    }
};
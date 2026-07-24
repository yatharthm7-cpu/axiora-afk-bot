const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a user to this ticket')
        .addUserOption(option => option.setName('user').setDescription('The user to add').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true
        });

        await interaction.reply({ content: `✅ Successfully added ${targetUser} to the ticket.` });
    }
};
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a user from this ticket')
        .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        
        await interaction.channel.permissionOverwrites.edit(targetUser.id, {
            ViewChannel: false
        });

        await interaction.reply({ content: `⛔ Successfully removed ${targetUser} from the ticket.` });
    }
};
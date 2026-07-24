const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Rename the current ticket')
        .addStringOption(option => option.setName('name').setDescription('The new name').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
        
    async execute(interaction) {
        const newName = interaction.options.getString('name');
        
        await interaction.channel.setName(newName);
        await interaction.reply({ content: `📝 Ticket renamed to \`${newName}\`.` });
    }
};
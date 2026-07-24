const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close the current ticket'),
        
    async execute(interaction) {
        // Verify the channel is inside the Ticket Category using the parentId, completely ignoring the channel name
        if (interaction.channel.parentId !== process.env.TICKET_CATEGORY_ID) {
            return interaction.reply({ 
                content: 'This command can only be used inside a ticket!', 
                ephemeral: true 
            });
        }

        await interaction.reply({ content: '🔒 Ticket closed. Deleting channel in 5 seconds...' });
        
        setTimeout(() => {
            interaction.channel.delete().catch(console.error);
        }, 5000);
    }
};
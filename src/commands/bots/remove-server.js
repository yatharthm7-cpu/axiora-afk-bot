const { SlashCommandBuilder, MessageFlags } = require('discord.js');
// IMPORTANT: Update this path to point to your actual Mongoose Server model!
const Server = require('../../models/Server'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-server')
        .setDescription('Permanently delete a saved server from the database')
        .addStringOption(option => 
            option.setName('ip')
                .setDescription('The IP of the server to remove')
                .setRequired(true)
                .setAutocomplete(true)
        ),
        
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const servers = await Server.find({ 
            ip: new RegExp(focusedValue, 'i') // Change 'ip' if your schema uses a different field name
        }).limit(25);
        
        await interaction.respond(
            servers.map(srv => ({ name: srv.ip, value: srv.ip }))
        );
    },

    async execute(interaction) {
        const ip = interaction.options.getString('ip');

        // Delete from MongoDB
        const deletedServer = await Server.findOneAndDelete({ ip: ip }); // Adjust field name if needed
        
        if (!deletedServer) {
            return interaction.reply({ 
                content: `⚠️ Server \`${ip}\` was not found in the database.`, 
                flags: MessageFlags.Ephemeral 
            });
        }

        await interaction.reply({ 
            content: `🗑️ **Success:** Server \`${ip}\` has been deleted from the database.`, 
            flags: MessageFlags.Ephemeral 
        });
    }
};
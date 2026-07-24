// src/commands/server.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Server = require('../../models/Server');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Manage saved server IPs')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Save a new server IP')
                .addStringOption(opt => opt.setName('name').setDescription('Short name (e.g. main, hypixel)').setRequired(true))
                .addStringOption(opt => opt.setName('ip').setDescription('Server IP Address').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all your saved servers')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const name = interaction.options.getString('name').toLowerCase();
            const ip = interaction.options.getString('ip');

            try {
                await Server.findOneAndUpdate(
                    { discordUserId: interaction.user.id, serverName: name },
                    { discordUserId: interaction.user.id, serverName: name, serverIp: ip },
                    { upsert: true, new: true }
                );

                await interaction.reply({ 
                    content: `✅ Server profile \`${name}\` (\`${ip}\`) saved!`, 
                    flags: MessageFlags.Ephemeral 
                });
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: `⚠️ Failed to save server: ${err.message}`, flags: MessageFlags.Ephemeral });
            }
        } 

        else if (subcommand === 'list') {
            const servers = await Server.find({ discordUserId: interaction.user.id });
            if (servers.length === 0) {
                return interaction.reply({ content: '❌ You have no saved servers. Use `/server add` first.', flags: MessageFlags.Ephemeral });
            }

            const list = servers.map(s => `• **${s.serverName}**: \`${s.serverIp}\``).join('\n');
            await interaction.reply({ content: `🌐 **Your Saved Servers:**\n${list}`, flags: MessageFlags.Ephemeral });
        }
    },
};
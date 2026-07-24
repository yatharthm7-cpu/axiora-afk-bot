// src/commands/account.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Account = require('../../models/Account');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('Manage your saved Minecraft accounts')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Save a new Minecraft account')
                .addStringOption(opt => opt.setName('username').setDescription('Minecraft Username').setRequired(true))
                .addStringOption(opt => 
                    opt.setName('auth')
                        .setDescription('Auth Type (default: offline)')
                        .addChoices(
                            { name: 'Cracked (Offline)', value: 'offline' },
                            { name: 'Premium (Microsoft)', value: 'microsoft' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all your saved Minecraft accounts')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const username = interaction.options.getString('username');
            const authType = interaction.options.getString('auth') || 'offline';

            try {
                await Account.findOneAndUpdate(
                    { discordUserId: interaction.user.id, minecraftUsername: username },
                    { discordUserId: interaction.user.id, minecraftUsername: username, authType },
                    { upsert: true, returnDocument: 'after' } // <--- Fixed!
                );

                await interaction.reply({ 
                    content: `✅ Account \`${username}\` (${authType}) saved!`, 
                    flags: MessageFlags.Ephemeral 
                });
            } catch (err) {
                console.error(err);
                await interaction.reply({ content: `⚠️ Failed to save account: ${err.message}`, flags: MessageFlags.Ephemeral });
            }
        } 
        
        else if (subcommand === 'list') {
            const accounts = await Account.find({ discordUserId: interaction.user.id });
            if (accounts.length === 0) {
                return interaction.reply({ content: '❌ You have no saved accounts. Use `/account add` first.', flags: MessageFlags.Ephemeral });
            }

            const list = accounts.map(a => `• **${a.minecraftUsername}** (${a.authType})`).join('\n');
            await interaction.reply({ content: `📜 **Your Saved Accounts:**\n${list}`, flags: MessageFlags.Ephemeral });
        }
    },
};
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-slots')
        .setDescription('Remove bot slots from a user')
        .addUserOption(option => option.setName('user').setDescription('The customer').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('Number of slots to remove').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');

        let userData = await User.findOne({ discordId: targetUser.id });
        if (!userData) {
            return interaction.reply({ content: `⚠️ ${targetUser} does not have an active profile in the database.`, ephemeral: true });
        }

        // Prevent negative slots
        userData.maxBots = Math.max(0, userData.maxBots - amount);
        await userData.save();

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('📉 Slots Removed')
            .setDescription(`Successfully removed **${amount}** bot slots from ${targetUser}.\nThey can now run up to **${userData.maxBots}** bots.`);
        
        await interaction.reply({ embeds: [embed] });
    }
};
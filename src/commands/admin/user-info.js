const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Check a customer\'s bot limits and plan')
        .addUserOption(option => option.setName('user').setDescription('The customer').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        let userData = await User.findOne({ discordId: targetUser.id });
        if (!userData) {
            return interaction.reply({ content: `⚠️ ${targetUser} does not have an active profile in the database.`, ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`👤 Customer Info: ${targetUser.username}`)
            .addFields(
                { name: 'Plan Name', value: userData.planName, inline: true },
                { name: 'Bot Limit (Slots)', value: `${userData.maxBots}`, inline: true },
                { name: 'Currently Active', value: `${userData.activeBots}`, inline: true }
            )
            .setThumbnail(targetUser.displayAvatarURL());
        
        await interaction.reply({ embeds: [embed] });
    }
};
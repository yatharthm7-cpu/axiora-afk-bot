const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Blacklist = require('../../../models/Blacklist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage ticket creation access')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Blacklist a user from creating tickets')
                .addUserOption(option => option.setName('user').setDescription('The user to blacklist').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the blacklist').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a user from the ticket blacklist')
                .addUserOption(option => option.setName('user').setDescription('The user to remove').setRequired(true))
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');

        await interaction.deferReply({ ephemeral: true });

        if (subcommand === 'add') {
            const reason = interaction.options.getString('reason') || 'No reason provided';
            
            const existing = await Blacklist.findOne({ discordId: targetUser.id });
            if (existing) {
                return interaction.editReply(`⚠️ ${targetUser} is already blacklisted.`);
            }

            await Blacklist.create({
                discordId: targetUser.id,
                reason: reason,
                addedBy: interaction.user.id
            });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🚫 User Blacklisted')
                .setDescription(`${targetUser} has been blacklisted from using the ticket system.`)
                .addFields({ name: 'Reason', value: reason });

            return interaction.editReply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            const deleted = await Blacklist.findOneAndDelete({ discordId: targetUser.id });
            
            if (!deleted) {
                return interaction.editReply(`⚠️ ${targetUser} is not currently blacklisted.`);
            }

            return interaction.editReply(`✅ ${targetUser} has been removed from the blacklist and can open tickets again.`);
        }
    }
};
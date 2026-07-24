const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const User = require('../../models/User'); // Adjust path as needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give-slots')
        .setDescription('Provision bot slots and assign a subscription tier to a user.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to receive the slots')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('slots')
                .setDescription('Number of bot slots to allocate')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('days')
                .setDescription('Duration of the subscription in days (0 for lifetime)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('plan')
                .setDescription('The subscription tier to assign')
                .setRequired(true)
                .addChoices(
                    { name: 'Starter ($2.99/mo - No Proxies)', value: 'Starter' },
                    { name: 'Premium ($5.99/mo - Proxy Access)', value: 'Premium' },
                    { name: 'Faction ($12.99/mo - Full Access)', value: 'Faction' },
                    { name: 'Custom (Admin override)', value: 'Custom' }
                )),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('target');
        const slots = interaction.options.getInteger('slots');
        const days = interaction.options.getInteger('days');
        const plan = interaction.options.getString('plan');

        try {
            // Calculate Expiration
            let expiresAt = null;
            if (days > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + days);
            }

            // Upsert User Record
            const userRecord = await User.findOneAndUpdate(
                { discordId: targetUser.id },
                { 
                    discordId: targetUser.id,
                    maxBots: slots,
                    planName: plan,
                    expiresAt: expiresAt
                },
                { upsert: true, new: true }
            );

            // Format Expiry for Embed
            const expiryText = expiresAt 
                ? `<t:${Math.floor(expiresAt.getTime() / 1000)}:f>` 
                : 'Lifetime Access';

            // Success Embed for Admin
            const adminEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Provisioning Successful')
                .setDescription(`Successfully updated subscription for ${targetUser}.`)
                .addFields(
                    { name: 'Plan', value: `\`${plan}\``, inline: true },
                    { name: 'Slots', value: `\`${slots}\``, inline: true },
                    { name: 'Expires', value: expiryText, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [adminEmbed] });

            // Notify the Customer via DM
            const customerEmbed = new EmbedBuilder()
                .setColor('#00FF7F')
                .setTitle('🎉 Subscription Activated!')
                .setDescription(`Your **Axiora AFK** subscription has been provisioned by an administrator.`)
                .addFields(
                    { name: 'Active Plan', value: `\`${plan}\``, inline: true },
                    { name: 'Total Slots', value: `\`${slots}\``, inline: true },
                    { name: 'Expiration', value: expiryText, inline: false }
                )
                .setFooter({ text: 'You can now use /spawn and /set-proxy (if applicable)' })
                .setTimestamp();

            await targetUser.send({ embeds: [customerEmbed] }).catch(() => {
                console.log(`[Give-Slots] Could not DM user ${targetUser.tag}. Their DMs might be off.`);
            });

        } catch (error) {
            console.error('Error provisioning slots:', error);
            await interaction.editReply('❌ Database error occurred while provisioning slots.');
        }
    }
};
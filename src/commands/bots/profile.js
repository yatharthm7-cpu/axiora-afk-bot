const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const User = require('../../models/User');
const Account = require('../../models/Account');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Check your active plan, slot allocation, and subscription expiration.'),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const userRecord = await User.findOne({ discordId: interaction.user.id });
            const accountCount = await Account.countDocuments({ discordUserId: interaction.user.id });

            if (!userRecord || userRecord.maxBots === 0) {
                const noPlanEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('👤 Axiora Profile')
                    .setDescription('You currently do not have an active subscription plan.')
                    .addFields(
                        { name: 'Plan', value: '`Free Member`', inline: true },
                        { name: 'Bot Slots', value: '`0 Slots`', inline: true }
                    )
                    .setFooter({ text: 'Open a ticket in the server to purchase bot slots!' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [noPlanEmbed] });
            }

            const now = new Date();
            const isExpired = userRecord.expiresAt && userRecord.expiresAt <= now;

            let expiryFormatted = '`Lifetime / Never`';
            if (userRecord.expiresAt) {
                const unixSec = Math.floor(userRecord.expiresAt.getTime() / 1000);
                expiryFormatted = isExpired 
                    ? `⚠️ **Expired** (<t:${unixSec}:R>)` 
                    : `<t:${unixSec}:f> (<t:${unixSec}:R>)`;
            }

            const profileEmbed = new EmbedBuilder()
                .setColor(isExpired ? '#FF0000' : '#00FF7F')
                .setTitle(`👤 ${interaction.user.username}'s Profile`)
                .addFields(
                    { name: 'Plan Name', value: `\`${userRecord.planName || 'Premium AFK'}\``, inline: true },
                    { name: 'Slot Usage', value: `\`${accountCount} / ${userRecord.maxBots}\` Active`, inline: true },
                    { name: 'Status', value: isExpired ? '🔴 `EXPIRED`' : '🟢 `ACTIVE`', inline: true },
                    { name: 'Expiration Date', value: expiryFormatted, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [profileEmbed] });

        } catch (error) {
            console.error('Error executing /profile:', error);
            await interaction.editReply({ content: '❌ An error occurred while loading your profile.' });
        }
    },
};
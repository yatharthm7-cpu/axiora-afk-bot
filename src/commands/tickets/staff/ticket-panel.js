const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Deploy the Axiora Bot ticket panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#7C3AED')
            .setTitle('<:ticket:1530157223915819009> Axiora Bot Support & Purchasing')
            .setThumbnail('https://cdn.discordapp.com/attachments/1530131895969648734/1530240984104042626/Axiora_Logo.png?ex=6a64db79&is=6a6389f9&hm=051d11cfde35556650e95b6f646bc24a3737e8674751f06e85f933941b159508&')
            .setDescription(
                '**Welcome to Axiora Bot Support Center**\n\n' +
                'Select one of the options below to create a private support ticket. Our team will assist you as soon as possible.\n\n' +
                '<:cart:1530102769384554607> **Purchase Bot**\n' +
                '• Purchase premium bots\n' +
                '• Payment via UPI/QR\n' +
                '• Pre-sales questions\n\n' +
                '<:support:1530102767493058610> **Technical Support**\n' +
                '• Installation & setup\n' +
                '• Bug reports\n' +
                '• Feature assistance\n' +
                '• General support\n\n' +
                '> Please avoid opening multiple tickets for the same issue.'
            )
            .setFooter({ text: 'Axiora Bot Services' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_purchase')
                    .setLabel('Purchase Bots')
                    .setStyle(ButtonStyle.Success), 
                new ButtonBuilder()
                    .setCustomId('ticket_support')
                    .setLabel('Technical Support')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [buttons] });
    }
};
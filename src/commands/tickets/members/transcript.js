const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transcript')
        .setDescription('Save a copy of the ticket conversation'),
        
    async execute(interaction) {
        if (!interaction.channel.name.includes('-')) {
            return interaction.reply({ content: 'This command can only be used inside a ticket!', ephemeral: true });
        }

        await interaction.deferReply();

        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const transcriptData = messages.reverse().map(m => {
            return `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`;
        }).join('\n');

        const buffer = Buffer.from(transcriptData, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `${interaction.channel.name}-transcript.txt` });

        await interaction.editReply({ content: '📄 Here is the ticket transcript:', files: [attachment] });
    }
};
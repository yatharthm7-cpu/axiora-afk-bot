const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const Blacklist = require('../models/Blacklist'); // Adjust path if needed
const BotManager = require('../botManager'); // Adjust path to point back to your root BotManager

// Helper function to send errors for bot commands
const sendError = async (interaction, text) => {
    const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Action Failed')
        .setDescription(text);
        
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [errorEmbed], content: '' }).catch(() => {});
    } else {
        await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral }).catch(() => {});
    }
};

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        // ==========================================
        // 1. AUTOCOMPLETE HANDLER
        // ==========================================
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.autocomplete(interaction); } 
            catch (error) { console.error('Autocomplete Error:', error); }
            return; 
        }

        // ==========================================
        // 2. SLASH COMMAND HANDLER
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;
            try { await command.execute(interaction, client); } 
            catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                await sendError(interaction, 'An internal error occurred executing this command.');
            }
            return;
        }

        // ==========================================
        // 3. BUTTON CLICK HANDLER
        // ==========================================
        if (interaction.isButton()) {
            
            // --- A. TICKET SYSTEM BUTTONS ---
            if (interaction.customId.startsWith('ticket_')) {
                
                // 1. Ticket Creation
                if (interaction.customId === 'ticket_purchase' || interaction.customId === 'ticket_support') {
                    const isBlacklisted = await Blacklist.findOne({ discordId: interaction.user.id });
                    if (isBlacklisted) {
                        return interaction.reply({ 
                            content: `🚫 You have been blacklisted from creating tickets.\n**Reason:** ${isBlacklisted.reason}`, 
                            ephemeral: true 
                        });
                    }

                    const ticketType = interaction.customId === 'ticket_purchase' ? 'cart' : 'support';
                    const channelName = `${ticketType}-${interaction.user.username}`;
                    
                    const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName.toLowerCase());
                    if (existingChannel) {
                        return interaction.reply({ content: `You already have a ticket open at <#${existingChannel.id}>`, ephemeral: true });
                    }

                    const staffRoleId = process.env.STAFF_ROLE_ID;

                    const ticketChannel = await interaction.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: process.env.TICKET_CATEGORY_ID || null,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                            },
                            ...(staffRoleId ? [{
                                id: staffRoleId,
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                            }] : [])
                        ],
                    });

                    const welcomeEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle(`Ticket: ${interaction.user.username}`)
                        .setDescription(
                            interaction.customId === 'ticket_purchase' 
                            ? 'Thank you for choosing Axiora Bot! Please tell us your payment method and specify which plan you are buying. Staff will verify it shortly.' 
                            : 'Please describe your issue in detail. Our support staff will be with you shortly.'
                        );

                    const closeButton = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_close')
                            .setLabel('Close Ticket')
                            .setStyle(ButtonStyle.Danger)
                    );

                    const pingContent = staffRoleId ? `<@${interaction.user.id}> <@&${staffRoleId}>` : `<@${interaction.user.id}>`;

                    await ticketChannel.send({ 
                        content: pingContent, 
                        embeds: [welcomeEmbed], 
                        components: [closeButton] 
                    });

                    return interaction.reply({ content: `Your ticket has been created: <#${ticketChannel.id}>`, ephemeral: true });
                }

                // 2. Ticket Closing
                if (interaction.customId === 'ticket_close') {
                    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
                    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
                    return;
                }
            }

            // --- B. BOT MANAGER DASHBOARD BUTTONS ---
            const parts = interaction.customId.split('_');
            const action = parts.shift(); 
            const username = parts.join('_'); 
            const bot = BotManager.getBot(username);

            // If it's a bot button but the bot isn't online
            if (!bot && ['inv', 'drop', 'dc', 'chunk', 'refresh', 'toggleafk', 'toggleeat', 'rotate'].includes(action)) {
                return sendError(interaction, `Bot \`${username}\` is no longer online.`);
            }

            try {
                if (action === 'inv') {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); 
                    const items = bot.inventory.items();
                    
                    if (items.length === 0) {
                        return sendError(interaction, 'Inventory is completely empty!');
                    }

                    let invText = '';
                    for (const item of items) {
                        const cleanName = item.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        invText += `• **${cleanName}** (x${item.count})\n`;
                    }

                    const invEmbed = new EmbedBuilder()
                        .setColor('#3498DB')
                        .setTitle(`🎒 Inventory for ${username}`)
                        .setDescription(invText)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [invEmbed] });
                }
                else if (action === 'drop') {
                    const items = bot.inventory.items();
                    for (const item of items) await bot.tossStack(item);
                    const embed = new EmbedBuilder().setColor('#00FF00').setDescription(`✅ Dropped all items for \`${username}\`.`);
                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } 
                else if (action === 'dc') {
                    bot.manualDisconnect = true; 
                    bot.quit();
                    const embed = new EmbedBuilder().setColor('#FFA500').setDescription(`🛑 Disconnected \`${username}\`. Auto-reconnect disabled.`);
                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
                else if (action === 'chunk') {
                    await interaction.reply({ 
                        content: '⚠️ **Minimap Disabled:** Image processing features have been permanently removed from the bot to ensure 0% lag and save CPU resources.', 
                        flags: MessageFlags.Ephemeral 
                    });
                }
                else if (action === 'refresh') {
                    const currentPosition = BotManager.getFormattedPosition(bot);
                    const updatedEmbed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle(`🎮 Control Panel: ${username}`)
                        .setDescription(`Manage your AFK bot directly from this dashboard.\n\n📍 **Location:** \`${currentPosition}\``)
                        .addFields(
                            { name: 'Health', value: `❤️ ${bot.health || 20}/20`, inline: true },
                            { name: 'Food', value: `🍖 ${bot.food || 20}/20`, inline: true },
                            { name: 'Ping', value: `📶 ${bot.player?.ping || 0}ms`, inline: true }
                        )
                        .setTimestamp();
                    await interaction.update({ embeds: [updatedEmbed] });
                }
                else if (action === 'toggleafk') {
                    if (bot.antiAfkInterval) {
                        clearInterval(bot.antiAfkInterval);
                        bot.antiAfkInterval = null; 
                        const embed = new EmbedBuilder().setColor('#FFA500').setDescription(`⏸️ **Anti-AFK disabled** for \`${username}\`.`);
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    } else {
                        bot.antiAfkInterval = setInterval(() => {
                            bot.setControlState('jump', true);
                            setTimeout(() => bot.setControlState('jump', false), 500);
                            if (bot.entity) bot.look(bot.entity.yaw + 1, bot.entity.pitch);
                        }, 60000);
                        const embed = new EmbedBuilder().setColor('#00FF00').setDescription(`▶️ **Anti-AFK enabled** for \`${username}\`.`);
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                }
                else if (action === 'toggleeat') {
                    if (bot.autoEatEnabled === false) {
                        bot.autoEat.enableAuto();
                        bot.autoEatEnabled = true;
                        const embed = new EmbedBuilder().setColor('#00FF00').setDescription(`🍔 **Auto-Eat enabled** for \`${username}\`.`);
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    } else {
                        bot.autoEat.disableAuto();
                        bot.autoEatEnabled = false;
                        const embed = new EmbedBuilder().setColor('#FFA500').setDescription(`🛑 **Auto-Eat disabled** for \`${username}\`.`);
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                    }
                }
                else if (action === 'rotate') {
                    if (!bot.entity) return sendError(interaction, `\`${username}\` is not fully spawned yet.`);
                    await bot.look(bot.entity.yaw + (Math.PI / 2), bot.entity.pitch);
                    const embed = new EmbedBuilder().setColor('#00FF00').setDescription(`🔄 \`${username}\` rotated 90 degrees to the right.`);
                    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            } catch (err) {
                console.error(err);
                await sendError(interaction, err.message);
            }
        }
    }
};
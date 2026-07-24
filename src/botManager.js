const http = require('http');
const net = require('net');
const mineflayer = require('mineflayer');
const Account = require('./models/Account');
const autoEat = require('mineflayer-auto-eat').loader;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const minecraftData = require('minecraft-data');
const { SocksClient } = require('socks');
const { EmbedBuilder, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const activeBots = new Map();

class BotManager {
    
    // --- GLOBAL SPAWN QUEUE ---
    static spawnQueue = [];
    static isSpawning = false;

    static queueSpawn(accountData, discordClient, attemptCount = 0) {
        this.spawnQueue.push({ accountData, discordClient, attemptCount });
        this.processQueue();
    }

    static async processQueue() {
        if (this.isSpawning || this.spawnQueue.length === 0) return;
        this.isSpawning = true;

        const { accountData, discordClient, attemptCount } = this.spawnQueue.shift();

        try {
            this.spawnBot(accountData, discordClient, attemptCount);
        } catch (err) {
            console.error('Queue spawn error:', err);
        }

        setTimeout(() => {
            this.isSpawning = false;
            this.processQueue();
        }, 10000); 
    }

    static parseServerAddress(serverIp) {
        if (!serverIp) return { host: 'play.fatalmc.org', port: 25565 };
        const [host, rawPort] = String(serverIp).split(':');
        const port = Number(rawPort || 25565);
        return {
            host: host || 'play.fatalmc.org',
            port: Number.isInteger(port) ? port : 25565
        };
    }

    static normalizeProxyConfig(proxy) {
        if (!proxy) {
            if (!process.env.PROXY_HOST) return null;
            return {
                enabled: true,
                type: (process.env.PROXY_TYPE || 'http').toLowerCase(),
                host: process.env.PROXY_HOST,
                port: Number(process.env.PROXY_PORT || 8080),
                username: process.env.PROXY_USERNAME || '',
                password: process.env.PROXY_PASSWORD || ''
            };
        }

        if (typeof proxy === 'string') {
            const parsed = new URL(proxy);
            return {
                enabled: true,
                type: parsed.protocol.replace(':', '') === 'socks5' ? 'socks5' : 'http',
                host: parsed.hostname,
                port: Number(parsed.port || 8080),
                username: decodeURIComponent(parsed.username || ''),
                password: decodeURIComponent(parsed.password || '')
            };
        }

        return {
            enabled: true,
            type: String(proxy.type || 'http').toLowerCase(),
            host: proxy.host,
            port: Number(proxy.port || 8080),
            username: proxy.username || '',
            password: proxy.password || ''
        };
    }

    static connectThroughProxy(client, proxyConfig, host, port) {
        if (!proxyConfig || !proxyConfig.enabled) {
            throw new Error('No proxy configuration supplied.');
        }

        if (proxyConfig.type === 'socks5') {
            SocksClient.createConnection({
                proxy: {
                    host: proxyConfig.host,
                    port: Number(proxyConfig.port),
                    type: 5,
                    userId: proxyConfig.username || undefined,
                    password: proxyConfig.password || undefined
                },
                command: 'connect',
                destination: { host, port }
            }, (err, info) => {
                if (err) {
                    client.emit('error', err);
                    return;
                }
                client.setSocket(info.socket);
                client.emit('connect');
            });
            return;
        }

        const request = http.request({
            host: proxyConfig.host,
            port: Number(proxyConfig.port),
            method: 'CONNECT',
            path: `${host}:${port}`
        });

        request.on('connect', (res, socket) => {
            if (res.statusCode !== 200) {
                client.emit('error', new Error(`Proxy connection failed with status ${res.statusCode}`));
                return;
            }
            client.setSocket(socket);
            client.emit('connect');
        });

        request.on('error', (err) => {
            client.emit('error', err);
        });

        request.end();
    }

    static spawnBot(accountData, discordClient, attemptCount = 0) {
        const server = this.parseServerAddress(accountData.serverIp);
        const proxy = this.normalizeProxyConfig(accountData.proxy);
        const botConfig = {
            host: server.host,
            port: server.port,
            username: accountData.minecraftUsername,
            auth: accountData.authType,
            brand: 'vanilla',
            version: '1.21.11'
        };

        if (proxy && proxy.enabled) {
            botConfig.connect = (client) => {
                this.connectThroughProxy(client, proxy, server.host, server.port);
            };
        }

        const bot = mineflayer.createBot(botConfig);
        activeBots.set(accountData.minecraftUsername, bot);

        bot.loadPlugin(autoEat);
        bot.loadPlugin(pathfinder);

        // --- DISCORD COMMAND TRACKER FIX ---
        bot.once('inject_allowed', () => {
            const originalChat = bot.chat.bind(bot);
            bot.chat = (message) => {
                const isAutoCommand = message.startsWith('/login') || message.startsWith('/register') || message.startsWith('/server lifesteal');
                
                if (!isAutoCommand) {
                    bot.commandOutputWindow = Date.now() + 4000;
                }
                
                originalChat(message);
            };
        });

        bot.on('resourcePack', () => {
            bot.acceptResourcePack();
        });

        (async () => {
            try {
                const guild = discordClient.guilds.cache.get(process.env.GUILD_ID) 
                    || await discordClient.guilds.fetch(process.env.GUILD_ID);

                if (!guild) return;

                const channelName = accountData.minecraftUsername.toLowerCase().replace(/[^a-z0-9-]/g, '');

                let channel = guild.channels.cache.find(c => c.name === channelName);
                if (!channel) {
                    channel = await guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildText,
                        parent: process.env.CATEGORY_ID || null,
                        permissionOverwrites: [
                            {
                                id: guild.id, 
                                deny: [PermissionFlagsBits.ViewChannel], 
                            },
                            {
                                id: accountData.discordUserId, 
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                            },
                            ...(process.env.STAFF_ROLE_ID ? [{
                                id: process.env.STAFF_ROLE_ID, 
                                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                            }] : [])
                        ]
                    });
                }

                bot.discordChannelId = channel.id;

                const initEmbed = new EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle('🚀 Initializing Connection')
                    .setDescription(`Connecting **${accountData.minecraftUsername}** to \`${server.host}:${server.port}\`...`)
                    .setTimestamp();

                await channel.send({ embeds: [initEmbed] });

            } catch (err) {
                console.error(`Failed to manage channel for ${accountData.minecraftUsername}:`, err);
            }
        })();

        bot.on('messagestr', (message) => {
            if (!message || !message.trim()) return;
            const lowerMsg = message.toLowerCase();

            if (accountData.loginPassword) {
                if (lowerMsg.includes('/register') || lowerMsg.includes('register using')) {
                    setTimeout(() => {
                        bot.chat(`/register ${accountData.loginPassword} ${accountData.loginPassword}`);
                    }, 1000); 
                } 
                else if (lowerMsg.includes('/login') || lowerMsg.includes('please login')) {
                    setTimeout(() => {
                        bot.chat(`/login ${accountData.loginPassword}`);
                    }, 1000);
                }
            }

            // 1. Send ALL game chat and outputs to the bot's individual channel
            if (bot.discordChannelId) {
                const channel = discordClient.channels.cache.get(bot.discordChannelId);
                if (channel) {
                    channel.send(`\`[IN-GAME]\` ${message}`).catch(err => {
                        if (err.code === 10003) bot.discordChannelId = null; 
                    });
                }
            }

            // 2. Send to Master Channel ONLY if the message arrives inside the command output window
            if (bot.commandOutputWindow && Date.now() < bot.commandOutputWindow) {
                const MASTER_CHANNEL_ID = process.env.MASTER_LOG_CHANNEL_ID;
                const masterChannel = discordClient.channels.cache.get(MASTER_CHANNEL_ID);
                
                if (masterChannel) {
                    masterChannel.send(`\`[${accountData.minecraftUsername}]\` ${message}`).catch(() => {});
                }
            }
        });

        bot.on('error', (err) => {
            if (!bot.discordChannelId) return;

            const channel = discordClient.channels.cache.get(bot.discordChannelId);
            if (channel) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⚠️ Minecraft Bot Error')
                    .addFields(
                        { name: 'Bot Account', value: `\`${bot.username || accountData.minecraftUsername}\``, inline: true },
                        { name: 'Error Details', value: `\`\`\`\n${err.message || err}\n\`\`\`` }
                    )
                    .setTimestamp();

                channel.send({ content: '<@723472069328633949>', embeds: [errorEmbed] }).catch(err => {
                    if (err.code === 10003) bot.discordChannelId = null; 
                });
            }
        });

        bot.on('end', (reason) => {
            activeBots.delete(accountData.minecraftUsername);

            if (bot.antiAfkInterval) clearInterval(bot.antiAfkInterval);

            if (bot.discordChannelId) {
                const channel = discordClient.channels.cache.get(bot.discordChannelId);
                if (channel) {
                    if (bot.manualDisconnect) {
                        const dcEmbed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle('🛑 Manual Disconnect')
                            .setDescription(`\`${accountData.minecraftUsername}\` was disconnected manually.\n\n🗑️ *Cleaning up workspace... This channel will be deleted in 5 seconds.*`)
                            .setTimestamp();

                        channel.send({ embeds: [dcEmbed] }).catch(err => {
                            if (err.code === 10003) bot.discordChannelId = null;
                        });
                        
                        // ⬇️ Free up the user's database slot so they can spawn a different bot later
                        Account.findOneAndDelete({ minecraftUsername: accountData.minecraftUsername })
                            .catch(err => console.error('Failed to free database slot:', err));
                        
                        setTimeout(() => {
                            channel.delete().catch(() => {});
                        }, 5000);
                        return;
                    }

                    const jitter = Math.floor(Math.random() * 15000);
                    const delayMs = Math.min(60000 * Math.pow(2, attemptCount), 3600000) + jitter;
                    const delayText = delayMs < 60000 ? `${(delayMs / 1000).toFixed(1)} seconds` : `${(delayMs / 60000).toFixed(1)} minutes`;

                    const disconnectEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('🔴 Disconnected from Server')
                        .setDescription(`\`${accountData.minecraftUsername}\` lost connection.\n**Reason:** \`${reason}\` \n\n*Reconnecting in ${delayText}... (Retry attempt ${attemptCount + 1})*`)
                        .setTimestamp();

                    channel.send({ content: '<@723472069328633949>', embeds: [disconnectEmbed] }).catch(err => {
                        if (err.code === 10003) bot.discordChannelId = null;
                    });

                    setTimeout(() => {
                        BotManager.queueSpawn(accountData, discordClient, attemptCount + 1);
                    }, delayMs);
                }
            } else if (!bot.manualDisconnect) {
                const jitter = Math.floor(Math.random() * 15000);
                const delayMs = Math.min(60000 * Math.pow(2, attemptCount), 3600000) + jitter;
                setTimeout(() => {
                    BotManager.queueSpawn(accountData, discordClient, attemptCount + 1);
                }, delayMs);
            }
        });

        bot.on('spawn', () => {
            bot.autoEat.enableAuto();
            bot.autoEatEnabled = true; 

            if (bot.antiAfkInterval) clearInterval(bot.antiAfkInterval);
            attemptCount = 0;

            const mcData = minecraftData(bot.version);
            const defaultMove = new Movements(bot, mcData);
            
            defaultMove.canDig = false; 
            defaultMove.allow1by1towers = false;
            
            bot.pathfinder.setMovements(defaultMove);

            bot.antiAfkInterval = setInterval(() => {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
                if (bot.entity) bot.look(bot.entity.yaw + 1, bot.entity.pitch);
            }, 60000);

            // --- SMART REJOIN LOGIC ---
            if (!bot.hasSpawnedOnce) {
                bot.hasSpawnedOnce = true;
                
                setTimeout(() => {
                    bot.chat('/server lifesteal');
                }, 10000);
            } else {
                setTimeout(() => {
                    bot.chat('/server lifesteal');
                }, 300000); 
            }

            if (bot.discordChannelId) {
                const channel = discordClient.channels.cache.get(bot.discordChannelId);
                if (channel) {
                    const spawnEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Successfully Spawned')
                        .setDescription(`**${accountData.minecraftUsername}** is now in-game. Auto-Eat & Anti-AFK initialized.`)
                        .setTimestamp();

                    // --- INJECT INTERACTIVE BUTTON DASHBOARD ---
                    const row1 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`refresh_${accountData.minecraftUsername}`).setLabel('🔄 Refresh').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId(`inv_${accountData.minecraftUsername}`).setLabel('🎒 Inventory').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`rotate_${accountData.minecraftUsername}`).setLabel('🔄 Rotate').setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder().setCustomId(`toggleafk_${accountData.minecraftUsername}`).setLabel('⏸️ Toggle AFK').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId(`toggleeat_${accountData.minecraftUsername}`).setLabel('🍔 Toggle Eat').setStyle(ButtonStyle.Success)
                    );

                    const row2 = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`drop_${accountData.minecraftUsername}`).setLabel('🗑️ Drop Items').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId(`dc_${accountData.minecraftUsername}`).setLabel('🛑 Despawn Bot').setStyle(ButtonStyle.Danger)
                    );

                    channel.send({ embeds: [spawnEmbed], components: [row1, row2] }).catch(err => {
                        if (err.code === 10003) bot.discordChannelId = null;
                    });
                }
            }
        });

        return bot;
    }

    static getFormattedPosition(bot) {
        if (!bot || !bot.entity?.position) return 'X: ? | Y: ? | Z: ?';
        const { x, y, z } = bot.entity.position;
        return `X: ${Math.floor(x)} | Y: ${Math.floor(y)} | Z: ${Math.floor(z)}`;
    }

    static startPatrol(bot, waypoints) {
        if (!bot || !bot.pathfinder) return false;

        bot.patrolWaypoints = waypoints; 
        bot.patrolIndex = 0;
        bot.isPatrolling = true;

        if (!bot._patrolGoalListenerAttached) {
            bot._patrolGoalListenerAttached = true;
            bot.on('goal_reached', () => {
                if (!bot.isPatrolling || !bot.patrolWaypoints || bot.patrolWaypoints.length === 0) return;

                bot.patrolIndex = (bot.patrolIndex + 1) % bot.patrolWaypoints.length;
                const nextPoint = bot.patrolWaypoints[bot.patrolIndex];
                
                setTimeout(() => {
                    if (bot.isPatrolling && bot.pathfinder) {
                        bot.pathfinder.setGoal(new goals.GoalBlock(nextPoint.x, nextPoint.y, nextPoint.z));
                    }
                }, 2000);
            });
        }

        const firstPoint = waypoints[0];
        bot.pathfinder.setGoal(new goals.GoalBlock(firstPoint.x, firstPoint.y, firstPoint.z));
        return true;
    }

    static stopPatrol(bot) {
        if (!bot) return;
        bot.isPatrolling = false;
        bot.patrolWaypoints = [];
        if (bot.pathfinder) bot.pathfinder.setGoal(null);
    }

    static getBot(username) {
        return activeBots.get(username);
    }

    static getAllBots() {
        return activeBots;
    }
}

module.exports = BotManager;
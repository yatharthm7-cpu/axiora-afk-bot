const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');

const deployCommands = require('./deploy-commands'); 
const Account = require('./models/Account'); 

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// --- DYNAMIC COMMAND LOADER (Supports Nested Sub-folders) ---
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadCommands(fullPath); 
        } else if (file.name.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
};
loadCommands(commandsPath);

// --- DYNAMIC EVENT LOADER ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
}

async function start() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Database Cleanup Task
        const fixResult = await Account.updateMany(
            { serverIp: { $regex: /^127\.0\.0\.1/ } },
            { $set: { serverIp: 'play.fatalmc.org:25565' } }
        );
        if (fixResult.modifiedCount > 0) {
            console.log(`🛠️ Cleaned up Database: Fixed ${fixResult.modifiedCount} accounts with local IPs.`);
        }

        await deployCommands();
        await client.login(process.env.DISCORD_TOKEN);

    } catch (err) {
        console.error('❌ Application failed to start:', err);
    }
}

start();
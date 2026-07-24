const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const commands = [];
const commandTracker = new Map(); // Added to track duplicate names
const commandsPath = path.join(__dirname, 'commands');

const readCommands = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            readCommands(fullPath); 
        } else if (file.name.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                const cmdName = command.data.name;
                
                // If the name already exists, trigger the alarm
                if (commandTracker.has(cmdName)) {
                    console.log(`\n🚨 DUPLICATE COMMAND DETECTED: "/${cmdName}"`);
                    console.log(`File 1: ${commandTracker.get(cmdName)}`);
                    console.log(`File 2: ${fullPath}\n`);
                } else {
                    commandTracker.set(cmdName, fullPath);
                    commands.push(command.data.toJSON());
                }
            }
        }
    }
};

readCommands(commandsPath);

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

module.exports = async () => {
    try {
        console.log(`🔄 Auto-deploying ${commands.length} slash commands...`);
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands }
        );
        
        console.log('✅ Guild slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Failed to deploy commands:', error.message);
    }
};
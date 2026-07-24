// src/models/Server.js
const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    discordUserId: { type: String, required: true },
    serverName: { type: String, required: true }, // e.g., "hypixel" or "survival"
    serverIp: { type: String, required: true },     // e.g., "mc.hypixel.net"
});

module.exports = mongoose.model('Server', serverSchema);
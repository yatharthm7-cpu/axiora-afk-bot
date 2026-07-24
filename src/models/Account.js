const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    discordUserId: { type: String, required: true },
    minecraftUsername: { type: String, required: true, unique: true },
    serverIp: { type: String, default: 'play.fatalmc.org:25565' },
    loginPassword: { type: String, default: null },
    authType: { type: String, default: 'offline' },
    autoReconnect: { type: Boolean, default: true },
    // ⬇️ Ensure this proxy object exists
    proxy: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['http', 'socks5'], default: 'http' },
        host: { type: String },
        port: { type: Number },
        username: { type: String },
        password: { type: String }
    }
});

module.exports = mongoose.model('Account', accountSchema);
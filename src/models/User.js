const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    maxBots: { type: Number, default: 0 }, // The limit they purchased (0 for free users)
    activeBots: { type: Number, default: 0 }, // How many they currently have running
    planName: { type: String, default: 'Member' },
    totalSpent: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null } // ⬅️ Required for the automated cron job expiry
});

module.exports = mongoose.model('User', userSchema);
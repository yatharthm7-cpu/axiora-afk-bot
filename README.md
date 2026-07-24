# 🤖 Axiora AFK
### Enterprise Minecraft AFK Bot Platform

**Axiora AFK** is a premium SaaS platform built with **Node.js**, **Discord.js**, **Mineflayer**, and **MongoDB**, allowing Minecraft players to deploy and manage **24/7 AFK bots** directly from Discord.

Designed for **Lifesteal**, **Survival**, and **Economy** servers, Axiora AFK provides an intuitive dashboard, subscription management, proxy support, automatic reconnects, and enterprise-grade automation.

---

# 🎯 Objectives

Axiora AFK is designed to provide a seamless AFK experience by offering:

- ✅ 24/7 online Minecraft bots
- ✅ Discord-based bot management
- ✅ Subscription-based SaaS architecture
- ✅ Enterprise-grade reliability
- ✅ Secure account & proxy management
- ✅ Zero manual maintenance for customers

---

# 🏗️ System Architecture

```text
                Discord Users
                      │
                      ▼
              Discord.js Bot
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
   MongoDB Database          Mineflayer Workers
        │                           │
        └─────────────┬─────────────┘
                      ▼
             Minecraft Servers
```

### Components

### 🤖 Discord Bot
Responsible for:

- Slash Commands
- Dashboard Buttons
- Ticket System
- Subscription Management
- Status Embeds

---

### 🗄️ Database

Stores:

- User Profiles
- Minecraft Accounts
- Proxy Information
- Subscription Plans
- Bot Configurations
- Active Sessions

---

### ⛏️ Mineflayer Workers

Handles:

- Minecraft Connections
- AFK Logic
- Auto-Reconnect
- Auto-Eat
- Inventory Updates
- Real-Time Events

---

# ✨ Features

## 🤖 Bot Management

Deploy and manage Minecraft bots directly from Discord.

### Includes

- ✅ 24/7 AFK Persistence
- ✅ Automatic Reconnect
- ✅ Crash Recovery
- ✅ Smart Queue System
- ✅ Multi-Account Support
- ✅ Spawn & Despawn Controls
- ✅ Smart Auto-Eat
- ✅ Health Monitoring
- ✅ Inventory Synchronization
- ✅ Connection Logs

---

## 🛡️ Anti-Ban & Networking

Built specifically for multiplayer Minecraft servers.

### Features

- HTTP Proxy Support
- SOCKS5 Proxy Support
- Username/Password Authentication
- Individual Proxy Per Bot
- Automatic Proxy Validation
- IP Isolation
- Premium Plan Restrictions

Supported formats:

```text
IP:PORT

IP:PORT:USERNAME:PASSWORD
```

---

## 📊 Live Dashboard

Every customer receives a personal control panel.

### Dashboard Features

- 🟢 Online Status
- 🔴 Offline Status
- 📶 Ping
- ❤️ Health
- 🍗 Hunger
- 📍 Coordinates
- 🎒 Inventory Viewer
- 🌎 Dimension
- ⏳ Uptime
- 📦 Active Slots
- 💎 Subscription Tier
- ⏰ Expiration Countdown

Status updates automatically without sending new messages.

---

## 💳 Subscription System

Completely automated SaaS billing logic.

### Supports

- Starter Plan
- Premium Plan
- Faction Plan

Automatically handles:

- Slot Allocation
- Plan Upgrades
- Plan Downgrades
- Expiration Dates
- Countdown Timers
- Bot Suspension
- Subscription Renewal

Example:

```text
Plan
Premium

Slots
2 / 3

Expires
<t:1735689600:R>
```

---

## 👑 Administration Suite

Powerful tools for server administrators.

### Features

- Give Slots
- Remove Slots
- Upgrade Plans
- Downgrade Plans
- Broadcast Announcements
- Deploy Ticket Panels
- View Node Health
- Restart Workers
- Manage Customers
- Subscription Controls

---

## 🎫 Ticket System

Integrated Discord ticket workflow.

### Purchase Ticket

- Purchase Bots
- Subscription Renewal
- Plan Upgrade
- Payment Verification

### Support Ticket

- Installation Help
- Bug Reports
- Technical Issues
- General Questions

Every ticket creates a private support channel visible only to the customer and staff.

---

# 💎 Subscription Plans

| Feature | 🥉 Starter | 🥈 Premium | 🥇 Faction |
|----------|------------|------------|------------|
| Price | ₹249/month | ₹499/month | ₹999/month |
| Bot Slots | 1 | 3 | 10 |
| 24/7 AFK | ✅ | ✅ | ✅ |
| Auto-Reconnect | ✅ | ✅ | ✅ |
| Smart Auto-Eat | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Custom Proxies | ❌ | ✅ | ✅ |
| HTTP Proxy | ❌ | ✅ | ✅ |
| SOCKS5 Proxy | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |

---

# ⚙️ Technology Stack

| Component | Technology |
|------------|------------|
| Runtime | Node.js v22 |
| Discord API | Discord.js v14 |
| Minecraft Automation | Mineflayer |
| Database | MongoDB + Mongoose |
| Scheduler | node-cron |
| Hosting | Linux + Pterodactyl |
| Language | JavaScript |

---

# 📜 Slash Commands

## 👤 Customer Commands

| Command | Description |
|----------|-------------|
| `/profile` | View active plan, slots, and expiration |
| `/spawn <account>` | Start an AFK bot |
| `/despawn <account>` | Stop a bot |
| `/set-proxy <account> <proxy>` | Configure HTTP/SOCKS5 proxy *(Premium+ only)* |

---

## 👑 Administrator Commands

| Command | Description |
|----------|-------------|
| `/give-slots` | Assign plans and bot slots |
| `/broadcast` | Send announcements |
| `/setup-tickets` | Deploy the ticket panel |
| `/node-status` | View worker status |
| `/restart-worker` | Restart a Mineflayer worker |
| `/subscription` | Manage customer subscriptions |

---

# 📁 Environment Variables

Create a `.env` file in the project root.

```env
#################################
# Discord Configuration
#################################

DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

#################################
# MongoDB
#################################

MONGO_URI=

#################################
# Status Panel
#################################

STATUS_CHANNEL_ID=
STATUS_MESSAGE_ID=

#################################
# Ticket System
#################################

TICKET_CATEGORY_ID=
STAFF_ROLE_ID=
LOG_CHANNEL_ID=

#################################
# Default Minecraft Server
#################################

DEFAULT_SERVER_HOST=
DEFAULT_SERVER_PORT=

#################################
# Worker Settings
#################################

NODE_ENV=production
```

---

# 🚀 Project Goals

The long-term vision for Axiora AFK includes:

- Enterprise-quality architecture
- Modular codebase
- Multi-node scalability
- Secure SaaS subscription management
- Reliable Mineflayer workers
- Zero-downtime deployments
- Easy customer onboarding
- Premium Discord user experience
- High-performance bot orchestration
- Future REST API & Web Dashboard support

---

# 📄 License

This project is proprietary software developed for **Axiora AFK**.

Unauthorized redistribution, resale, or modification is prohibited without permission.
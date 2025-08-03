# QOL Helper Bot

A Discord bot for managing QOL Hub client listings with forum post creation and moderation features.

## Features

### Client Listing Commands
- `/listcheat` - Submit a cheat client to be listed in the forum
- `/listmacro` - Submit a macro client to be listed in the forum
- `/listlegit` - Submit a legit client to be listed in the forum

Each command opens a modal form where users can input:
- Client name
- Minecraft version (1.8.9 or 1.21.5)
- Whether it's free or paid
- Discord server invite (optional)
- Website/GitHub link (optional)

The bot automatically creates forum posts with the format `[FREE/PAID] ClientName` in the appropriate version-specific forum channel and includes all provided information.

**Note:** These commands require a specific role to use (configurable via `CLIENT_LISTING_ROLE_ID`).

### Additional Listing Commands
- `/listcoinshop` - Submit a coin shop to be listed in the forum
- `/listother` - Submit other items/services to be listed in the forum

These commands allow users to list:
- **Coin Shops**: Name, description, pricing, contact info, payment links
- **Other Items**: Services, tools, resources with category, description, pricing, and contact info

### Giveaway Commands
- `/giveaway` - Create a new giveaway with customizable settings
- `/giveaway-list` - List all active giveaways
- `/giveaway-end` - End an active giveaway early
- `/giveaway-cancel` - Cancel an active giveaway
- `/giveaway-reroll` - Reroll winners for an ended giveaway

Giveaway features:
- Interactive join buttons for participants
- Automatic winner selection and announcement
- Scheduled ending with customizable duration
- Role requirement support (coming soon)
- Comprehensive management tools

### Moderation Commands
- `/mute` - Timeout a user (requires Moderate Members permission)
- `/kick` - Kick a user from the server (requires Kick Members permission)
- `/ban` - Ban a user from the server (requires Ban Members permission)

## Setup Instructions

### 1. Prerequisites
- Node.js 18.0.0 or higher
- A Discord application and bot token

### 2. Discord Bot Setup
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token
5. Enable the following bot permissions:
   - Send Messages
   - Use Slash Commands
   - Manage Messages
   - Kick Members
   - Ban Members
   - Moderate Members
   - Create Public Threads
   - Send Messages in Threads

### 3. Server Setup
1. Create forum channels for each listing type:
   - Cheat clients forum (1.8.9)
   - Cheat clients forum (1.21.5)
   - Macro clients forum (1.8.9)
   - Macro clients forum (1.21.5)
   - Legit clients forum (1.8.9)
   - Legit clients forum (1.21.5)
   - Coin shops forum
   - Other items/services forum
2. Create a role for users who can submit listings (optional)
3. Get the channel IDs for each forum channel and the role ID
4. Get your server (guild) ID

### 4. Installation
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your `.env` file with the required values:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here

   # Version-specific forum channels
   CHEAT_FORUM_189_CHANNEL_ID=your_cheat_189_forum_channel_id
   CHEAT_FORUM_1215_CHANNEL_ID=your_cheat_1215_forum_channel_id
   MACRO_FORUM_189_CHANNEL_ID=your_macro_189_forum_channel_id
   MACRO_FORUM_1215_CHANNEL_ID=your_macro_1215_forum_channel_id
   LEGIT_FORUM_189_CHANNEL_ID=your_legit_189_forum_channel_id
   LEGIT_FORUM_1215_CHANNEL_ID=your_legit_1215_forum_channel_id

   # Additional forum channels
   COIN_SHOP_FORUM_CHANNEL_ID=your_coin_shop_forum_channel_id
   OTHER_FORUM_CHANNEL_ID=your_other_forum_channel_id

   # Role permissions (optional)
   CLIENT_LISTING_ROLE_ID=your_client_listing_role_id

   GUILD_ID=your_guild_id_here
   ```

### 5. Deploy Commands
Deploy the slash commands to your server:
```bash
node src/deploy-commands.js
```

### 6. Start the Bot
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your Discord application client ID
- `GUILD_ID` - Your Discord server ID

**Forum Channels:**
- `CHEAT_FORUM_189_CHANNEL_ID` - Channel ID for 1.8.9 cheat client forum
- `CHEAT_FORUM_1215_CHANNEL_ID` - Channel ID for 1.21.5 cheat client forum
- `MACRO_FORUM_189_CHANNEL_ID` - Channel ID for 1.8.9 macro client forum
- `MACRO_FORUM_1215_CHANNEL_ID` - Channel ID for 1.21.5 macro client forum
- `LEGIT_FORUM_189_CHANNEL_ID` - Channel ID for 1.8.9 legit client forum
- `LEGIT_FORUM_1215_CHANNEL_ID` - Channel ID for 1.21.5 legit client forum
- `COIN_SHOP_FORUM_CHANNEL_ID` - Channel ID for coin shop listings
- `OTHER_FORUM_CHANNEL_ID` - Channel ID for other items/services

**Role Permissions:**
- `CLIENT_LISTING_ROLE_ID` - Role ID required to use listing commands (optional)

### Getting Channel IDs
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on the forum channel and select "Copy Channel ID"

### Getting Guild ID
1. Right-click on your server name and select "Copy Server ID"

## Usage

### Submitting Listings
1. **Clients**: Use `/listcheat`, `/listmacro`, or `/listlegit` for Minecraft clients
2. **Coin Shops**: Use `/listcoinshop` for coin selling services
3. **Other Items**: Use `/listother` for tools, services, resources, etc.
4. Fill out the modal form with the required information
5. The bot will create a forum post in the appropriate channel

**Note**: You need the configured role to use listing commands (if `CLIENT_LISTING_ROLE_ID` is set).

### Creating Giveaways
1. Use `/giveaway` to create a new giveaway
2. Fill out the form with title, prize, description, duration, and winner count
3. The bot will post an interactive giveaway message with a join button
4. Users can click the button to join, and winners are automatically selected when it ends

### Managing Giveaways
- `/giveaway-list` - View all active giveaways with their IDs
- `/giveaway-end <id>` - End a giveaway early and select winners
- `/giveaway-cancel <id>` - Cancel a giveaway without selecting winners
- `/giveaway-reroll <id> [winner_count]` - Reroll winners for an ended giveaway

### Moderation
- `/mute @user [duration] [reason]` - Mute a user for specified minutes (default: 60)
- `/kick @user [reason]` - Kick a user from the server
- `/ban @user [delete_days] [reason]` - Ban a user and optionally delete their messages

## File Structure
```
src/
├── commands/           # Slash command files
│   ├── listcheat.js   # Cheat client listing command
│   ├── listmacro.js   # Macro client listing command
│   ├── listlegit.js   # Legit client listing command
│   ├── listcoinshop.js     # Coin shop listing command
│   ├── listother.js   # Other items listing command
│   ├── giveaway.js    # Giveaway creation command
│   ├── giveaway-list.js    # List active giveaways
│   ├── giveaway-end.js     # End giveaway command
│   ├── giveaway-cancel.js  # Cancel giveaway command
│   ├── giveaway-reroll.js  # Reroll giveaway command
│   ├── mute.js        # Mute command
│   ├── kick.js        # Kick command
│   └── ban.js         # Ban command
├── handlers/           # Event and interaction handlers
│   ├── clientFormHandler.js  # Client form submission handler
│   └── giveawayHandler.js    # Giveaway interaction handler
├── utils/             # Utility modules
│   ├── giveawayManager.js    # Giveaway data management
│   ├── permissions.js # Role permission checking
│   ├── getIds.js      # Channel/guild ID helper
│   └── validateConfig.js     # Configuration validation
├── data/              # Data storage
│   └── giveaways.json # Giveaway data file
├── config.js          # Configuration file
├── deploy-commands.js # Command deployment script
└── index.js           # Main bot file
```

## Support

If you encounter any issues or need help setting up the bot, please check the console logs for error messages and ensure all configuration values are correct.

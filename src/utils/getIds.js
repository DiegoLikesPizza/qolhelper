const { Client, GatewayIntentBits } = require('discord.js');
const config = require('../config');

// This utility script helps you get channel and guild IDs for configuration
// Run with: node src/utils/getIds.js

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log('='.repeat(50));
    
    try {
        // Get guild information
        const guild = await client.guilds.fetch(config.guildId);
        console.log(`Guild: ${guild.name}`);
        console.log(`Guild ID: ${guild.id}`);
        console.log('='.repeat(50));
        
        // Get all channels
        const channels = await guild.channels.fetch();
        
        console.log('Available Channels:');
        console.log('-'.repeat(30));
        
        channels.forEach(channel => {
            if (channel) {
                let channelType = 'Unknown';
                
                if (channel.isTextBased()) {
                    if (channel.isThread()) {
                        channelType = 'Thread';
                    } else if (channel.isThreadOnly()) {
                        channelType = 'Forum';
                    } else {
                        channelType = 'Text';
                    }
                } else if (channel.isVoiceBased()) {
                    channelType = 'Voice';
                } else {
                    channelType = channel.type;
                }
                
                console.log(`${channel.name} | ${channelType} | ID: ${channel.id}`);
            }
        });
        
        console.log('='.repeat(50));
        console.log('Forum Channels (for client listings):');
        console.log('-'.repeat(30));
        
        const forumChannels = channels.filter(channel => channel && channel.isThreadOnly());
        
        if (forumChannels.size === 0) {
            console.log('No forum channels found. You need to create forum channels for:');
            console.log('- Cheat clients');
            console.log('- Macro clients');
            console.log('- Legit clients');
        } else {
            forumChannels.forEach(channel => {
                console.log(`${channel.name} | ID: ${channel.id}`);
            });
        }
        
        console.log('='.repeat(50));
        console.log('Copy the IDs you need to your .env file:');
        console.log(`GUILD_ID=${guild.id}`);
        console.log('CHEAT_FORUM_CHANNEL_ID=<your_cheat_forum_channel_id>');
        console.log('MACRO_FORUM_CHANNEL_ID=<your_macro_forum_channel_id>');
        console.log('LEGIT_FORUM_CHANNEL_ID=<your_legit_forum_channel_id>');
        
    } catch (error) {
        console.error('Error fetching guild or channels:', error);
        console.log('Make sure your GUILD_ID is correct in the .env file');
    }
    
    client.destroy();
});

client.on('error', error => {
    console.error('Discord client error:', error);
});

if (!config.token) {
    console.error('Error: DISCORD_TOKEN not found in .env file');
    process.exit(1);
}

if (!config.guildId) {
    console.error('Error: GUILD_ID not found in .env file');
    process.exit(1);
}

client.login(config.token);

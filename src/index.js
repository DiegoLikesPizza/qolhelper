const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const { validateConfig } = require('./utils/validateConfig');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Create a collection to store commands
client.commands = new Collection();

// Load commands
const fs = require('fs');
const path = require('path');

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Event handlers
client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`Bot is in ${client.guilds.cache.size} guilds`);

    // Check for expired giveaways on startup
    checkExpiredGiveaways();

    // Set up periodic check for expired giveaways (every 5 minutes)
    setInterval(checkExpiredGiveaways, 5 * 60 * 1000);
});

// Function to check and end expired giveaways
async function checkExpiredGiveaways() {
    try {
        const giveawayManager = require('./utils/giveawayManager');
        const { endGiveawayAutomatically } = require('./handlers/giveawayHandler');

        const expiredGiveaways = giveawayManager.getExpiredGiveaways();

        for (const giveaway of expiredGiveaways) {
            console.log(`Ending expired giveaway: ${giveaway.id}`);
            await endGiveawayAutomatically(client, giveaway.id);
        }

        if (expiredGiveaways.length > 0) {
            console.log(`Ended ${expiredGiveaways.length} expired giveaway(s)`);
        }
    } catch (error) {
        console.error('Error checking expired giveaways:', error);
    }
}

client.on('interactionCreate', async interaction => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            
            const errorMessage = 'There was an error while executing this command!';
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
        try {
            if (interaction.customId.startsWith('client_form_')) {
                const { handleClientFormSubmission } = require('./handlers/clientFormHandler');
                await handleClientFormSubmission(interaction);
            } else if (interaction.customId === 'giveaway_form') {
                const { handleGiveawayFormSubmission } = require('./handlers/giveawayHandler');
                await handleGiveawayFormSubmission(interaction);
            }
        } catch (error) {
            console.error('Error handling modal submission:', error);

            const errorMessage = 'There was an error processing your submission!';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        try {
            if (interaction.customId.startsWith('giveaway_')) {
                const { handleGiveawayButtonInteraction } = require('./handlers/giveawayHandler');
                await handleGiveawayButtonInteraction(interaction);
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);

            const errorMessage = 'There was an error processing your interaction!';

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Validate configuration before starting
const configValidation = validateConfig();
if (!configValidation.success) {
    console.error('❌ Configuration validation failed:');
    configValidation.errors.forEach(error => {
        console.error(`   • ${error}`);
    });
    console.error('\nPlease fix the configuration errors before starting the bot.');
    process.exit(1);
}

if (configValidation.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    configValidation.warnings.forEach(warning => {
        console.warn(`   • ${warning}`);
    });
}

// Login to Discord
client.login(config.token);

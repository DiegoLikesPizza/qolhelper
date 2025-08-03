const { REST, Routes } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const commands = [];

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command) {
            commands.push(command.data.toJSON());
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" property.`);
        }
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// Deploy commands
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Register commands to specific guild for faster updates during development
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
})();

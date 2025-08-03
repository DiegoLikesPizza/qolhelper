const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcheat')
        .setDescription('Submit a cheat client to be listed in the forum'),
    
    async execute(interaction) {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('client_form_cheat')
            .setTitle('Submit Cheat Client');

        // Create text input components
        const nameInput = new TextInputBuilder()
            .setCustomId('client_name')
            .setLabel('Client Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the name of the cheat client')
            .setRequired(true)
            .setMaxLength(100);

        const versionInput = new TextInputBuilder()
            .setCustomId('client_version')
            .setLabel('Minecraft Version')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1.8.9 or 1.21.5')
            .setRequired(true)
            .setMaxLength(10);

        const freeInput = new TextInputBuilder()
            .setCustomId('client_free')
            .setLabel('Is it Free? (yes/no)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('yes or no')
            .setRequired(true)
            .setMaxLength(3);

        const discordInput = new TextInputBuilder()
            .setCustomId('client_discord')
            .setLabel('Discord Server Invite')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://discord.gg/example or discord.gg/example')
            .setRequired(false)
            .setMaxLength(200);

        const linkInput = new TextInputBuilder()
            .setCustomId('client_link')
            .setLabel('Website/GitHub Link')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://github.com/example or https://website.com')
            .setRequired(false)
            .setMaxLength(200);

        // Create action rows and add inputs
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(versionInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(freeInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(discordInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(linkInput);

        // Add action rows to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};

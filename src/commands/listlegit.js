const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasClientListingPermission, getClientListingRoleName } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listlegit')
        .setDescription('Submit a legit client to be listed in the forum'),

    async execute(interaction) {
        // Check if user has the required role
        if (!hasClientListingPermission(interaction.member)) {
            const roleName = getClientListingRoleName(interaction.guild);
            const roleMessage = roleName
                ? `You need the **${roleName}** role to list clients.`
                : 'You do not have permission to list clients.';

            return await interaction.reply({
                content: `❌ ${roleMessage}`,
                ephemeral: true
            });
        }
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('client_form_legit')
            .setTitle('Submit Legit Client');

        // Create text input components
        const nameInput = new TextInputBuilder()
            .setCustomId('client_name')
            .setLabel('Client Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the name of the legit client')
            .setRequired(true)
            .setMaxLength(100);

        const versionInput = new TextInputBuilder()
            .setCustomId('client_version')
            .setLabel('Minecraft Version')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1.8.9 or 1.21.5')
            .setRequired(true)
            .setMaxLength(10);

        const priceInput = new TextInputBuilder()
            .setCustomId('client_price')
            .setLabel('Price')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Free, $10, €15, Contact for pricing, etc.')
            .setRequired(true)
            .setMaxLength(50);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('client_description')
            .setLabel('Description (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe the client features, capabilities, etc.')
            .setRequired(false)
            .setMaxLength(1000);

        const discordInput = new TextInputBuilder()
            .setCustomId('client_discord')
            .setLabel('Discord Server Invite')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://discord.gg/example or discord.gg/example')
            .setRequired(false)
            .setMaxLength(200);

        // Create action rows and add inputs (Discord allows max 5 action rows)
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(versionInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(priceInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(discordInput);

        // Add action rows to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};

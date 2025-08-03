const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasClientListingPermission, getClientListingRoleName } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcoinshop')
        .setDescription('Submit a coin shop to be listed in the forum'),
    
    async execute(interaction) {
        // Check if user has the required role
        if (!hasClientListingPermission(interaction.member)) {
            const roleName = getClientListingRoleName(interaction.guild);
            const roleMessage = roleName 
                ? `You need the **${roleName}** role to list coin shops.`
                : 'You do not have permission to list coin shops.';
            
            return await interaction.reply({
                content: `❌ ${roleMessage}`,
                ephemeral: true
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('coinshop_form')
            .setTitle('Submit Coin Shop');

        // Create text input components
        const nameInput = new TextInputBuilder()
            .setCustomId('shop_name')
            .setLabel('Shop Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the name of the coin shop')
            .setRequired(true)
            .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('shop_description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe what the shop offers, payment methods, etc.')
            .setRequired(true)
            .setMaxLength(1000);

        const pricesInput = new TextInputBuilder()
            .setCustomId('shop_prices')
            .setLabel('Pricing Information')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('List your prices (e.g., 1000 coins = $5, 5000 coins = $20)')
            .setRequired(true)
            .setMaxLength(500);

        const discordInput = new TextInputBuilder()
            .setCustomId('shop_discord')
            .setLabel('Discord Contact')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Discord username or server invite')
            .setRequired(true)
            .setMaxLength(200);

        const linkInput = new TextInputBuilder()
            .setCustomId('shop_link')
            .setLabel('Website/Payment Link (Optional)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://website.com or payment platform link')
            .setRequired(false)
            .setMaxLength(200);

        // Create action rows and add inputs
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(pricesInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(discordInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(linkInput);

        // Add action rows to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};

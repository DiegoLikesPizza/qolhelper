const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasClientListingPermission, getClientListingRoleName } = require('../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listother')
        .setDescription('Submit other items/services to be listed in the forum'),
    
    async execute(interaction) {
        // Check if user has the required role
        if (!hasClientListingPermission(interaction.member)) {
            const roleName = getClientListingRoleName(interaction.guild);
            const roleMessage = roleName 
                ? `You need the **${roleName}** role to list items.`
                : 'You do not have permission to list items.';
            
            return await interaction.reply({
                content: `❌ ${roleMessage}`,
                ephemeral: true
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('other_form')
            .setTitle('Submit Other Item/Service');

        // Create text input components
        const nameInput = new TextInputBuilder()
            .setCustomId('item_name')
            .setLabel('Item/Service Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the name of your item or service')
            .setRequired(true)
            .setMaxLength(100);

        const categoryInput = new TextInputBuilder()
            .setCustomId('item_category')
            .setLabel('Category')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., Tool, Service, Resource, etc.')
            .setRequired(true)
            .setMaxLength(50);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('item_description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe your item/service, features, benefits, etc.')
            .setRequired(true)
            .setMaxLength(1000);

        const priceInput = new TextInputBuilder()
            .setCustomId('item_price')
            .setLabel('Price/Cost Information')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Free, $10, Contact for pricing, etc.')
            .setRequired(true)
            .setMaxLength(100);

        const contactInput = new TextInputBuilder()
            .setCustomId('item_contact')
            .setLabel('Contact Information')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Discord, website, email, or other contact methods')
            .setRequired(true)
            .setMaxLength(300);

        // Create action rows and add inputs
        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(categoryInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(priceInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(contactInput);

        // Add action rows to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Create a new giveaway')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ You do not have permission to create giveaways!',
                ephemeral: true
            });
        }

        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('giveaway_form')
            .setTitle('Create Giveaway');

        // Create text input components
        const titleInput = new TextInputBuilder()
            .setCustomId('giveaway_title')
            .setLabel('Giveaway Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter the giveaway title')
            .setRequired(true)
            .setMaxLength(100);

        const prizeInput = new TextInputBuilder()
            .setCustomId('giveaway_prize')
            .setLabel('Prize Description')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('What are you giving away?')
            .setRequired(true)
            .setMaxLength(200);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('giveaway_description')
            .setLabel('Description (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Additional details about the giveaway...')
            .setRequired(false)
            .setMaxLength(1000);

        const durationInput = new TextInputBuilder()
            .setCustomId('giveaway_duration')
            .setLabel('Duration (in minutes)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g., 60 for 1 hour, 1440 for 1 day')
            .setRequired(true)
            .setMaxLength(10);

        const winnersInput = new TextInputBuilder()
            .setCustomId('giveaway_winners')
            .setLabel('Number of Winners')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('How many winners? (default: 1)')
            .setRequired(false)
            .setMaxLength(3);

        // Create action rows and add inputs
        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(prizeInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(durationInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(winnersInput);

        // Add action rows to the modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    },
};

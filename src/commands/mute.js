const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout a user (mute them)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes (1-10080, default: 60)')
                .setMinValue(1)
                .setMaxValue(10080)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        // Check if the user has permission to moderate members
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return await interaction.reply({
                content: '❌ You do not have permission to mute members!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration') || 60; // Default 60 minutes
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Get the member object
            const targetMember = await interaction.guild.members.fetch(targetUser.id);

            // Check if the target user is the command executor
            if (targetUser.id === interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot mute yourself!',
                    ephemeral: true
                });
            }

            // Check if the target user is the bot
            if (targetUser.id === interaction.client.user.id) {
                return await interaction.reply({
                    content: '❌ I cannot mute myself!',
                    ephemeral: true
                });
            }

            // Check if the target member has higher or equal permissions
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ You cannot mute someone with equal or higher permissions!',
                    ephemeral: true
                });
            }

            // Check if the bot can moderate the target member
            if (!targetMember.moderatable) {
                return await interaction.reply({
                    content: '❌ I cannot mute this user! They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Calculate timeout duration in milliseconds
            const timeoutDuration = duration * 60 * 1000;

            // Apply the timeout
            await targetMember.timeout(timeoutDuration, reason);

            // Send success message
            await interaction.reply({
                content: `✅ **${targetUser.tag}** has been muted for **${duration} minutes**.\n**Reason:** ${reason}`,
                ephemeral: false
            });

            // Log the action (you can modify this to send to a log channel)
            console.log(`${interaction.user.tag} muted ${targetUser.tag} for ${duration} minutes. Reason: ${reason}`);

        } catch (error) {
            console.error('Error muting user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to mute the user.',
                ephemeral: true
            });
        }
    },
};

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7, default: 0)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        // Check if the user has permission to ban members
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({
                content: '❌ You do not have permission to ban members!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Check if the target user is the command executor
            if (targetUser.id === interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot ban yourself!',
                    ephemeral: true
                });
            }

            // Check if the target user is the bot
            if (targetUser.id === interaction.client.user.id) {
                return await interaction.reply({
                    content: '❌ I cannot ban myself!',
                    ephemeral: true
                });
            }

            // Try to get the member object (they might not be in the server)
            let targetMember = null;
            try {
                targetMember = await interaction.guild.members.fetch(targetUser.id);
            } catch (fetchError) {
                // User is not in the server, we can still ban by ID
                console.log(`User ${targetUser.tag} is not in the server, banning by ID.`);
            }

            // If the user is in the server, check permissions
            if (targetMember) {
                // Check if the target member has higher or equal permissions
                if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                    return await interaction.reply({
                        content: '❌ You cannot ban someone with equal or higher permissions!',
                        ephemeral: true
                    });
                }

                // Check if the bot can ban the target member
                if (!targetMember.bannable) {
                    return await interaction.reply({
                        content: '❌ I cannot ban this user! They may have higher permissions than me.',
                        ephemeral: true
                    });
                }

                // Try to send a DM to the user before banning (optional)
                try {
                    await targetUser.send(`You have been banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`);
                } catch (dmError) {
                    // User has DMs disabled or blocked the bot, continue with ban
                    console.log(`Could not send DM to ${targetUser.tag} before banning.`);
                }
            }

            // Ban the user
            await interaction.guild.members.ban(targetUser.id, {
                deleteMessageDays: deleteDays,
                reason: reason
            });

            // Send success message
            let successMessage = `✅ **${targetUser.tag}** has been banned from the server.\n**Reason:** ${reason}`;
            if (deleteDays > 0) {
                successMessage += `\n**Messages deleted:** ${deleteDays} day(s)`;
            }

            await interaction.reply({
                content: successMessage,
                ephemeral: false
            });

            // Log the action (you can modify this to send to a log channel)
            console.log(`${interaction.user.tag} banned ${targetUser.tag}. Reason: ${reason}. Delete days: ${deleteDays}`);

        } catch (error) {
            console.error('Error banning user:', error);
            
            if (error.code === 10026) {
                await interaction.reply({
                    content: '❌ User is already banned.',
                    ephemeral: true
                });
            } else if (error.code === 10013) {
                await interaction.reply({
                    content: '❌ User not found.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while trying to ban the user.',
                    ephemeral: true
                });
            }
        }
    },
};

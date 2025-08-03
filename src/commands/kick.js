const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        // Check if the user has permission to kick members
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({
                content: '❌ You do not have permission to kick members!',
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Get the member object
            const targetMember = await interaction.guild.members.fetch(targetUser.id);

            // Check if the target user is the command executor
            if (targetUser.id === interaction.user.id) {
                return await interaction.reply({
                    content: '❌ You cannot kick yourself!',
                    ephemeral: true
                });
            }

            // Check if the target user is the bot
            if (targetUser.id === interaction.client.user.id) {
                return await interaction.reply({
                    content: '❌ I cannot kick myself!',
                    ephemeral: true
                });
            }

            // Check if the target member has higher or equal permissions
            if (targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({
                    content: '❌ You cannot kick someone with equal or higher permissions!',
                    ephemeral: true
                });
            }

            // Check if the bot can kick the target member
            if (!targetMember.kickable) {
                return await interaction.reply({
                    content: '❌ I cannot kick this user! They may have higher permissions than me.',
                    ephemeral: true
                });
            }

            // Try to send a DM to the user before kicking (optional)
            try {
                await targetUser.send(`You have been kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}`);
            } catch (dmError) {
                // User has DMs disabled or blocked the bot, continue with kick
                console.log(`Could not send DM to ${targetUser.tag} before kicking.`);
            }

            // Kick the user
            await targetMember.kick(reason);

            // Send success message
            await interaction.reply({
                content: `✅ **${targetUser.tag}** has been kicked from the server.\n**Reason:** ${reason}`,
                ephemeral: false
            });

            // Log the action (you can modify this to send to a log channel)
            console.log(`${interaction.user.tag} kicked ${targetUser.tag}. Reason: ${reason}`);

        } catch (error) {
            console.error('Error kicking user:', error);
            
            if (error.code === 10007) {
                await interaction.reply({
                    content: '❌ User not found in this server.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while trying to kick the user.',
                    ephemeral: true
                });
            }
        }
    },
};

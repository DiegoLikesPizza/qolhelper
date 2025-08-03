const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const giveawayManager = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway-cancel')
        .setDescription('Cancel an active giveaway')
        .addStringOption(option =>
            option.setName('giveaway_id')
                .setDescription('The ID of the giveaway to cancel')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ You do not have permission to cancel giveaways!',
                ephemeral: true
            });
        }

        const giveawayId = interaction.options.getString('giveaway_id');

        try {
            const giveaway = giveawayManager.getGiveaway(giveawayId);

            if (!giveaway) {
                return await interaction.reply({
                    content: '❌ Giveaway not found! Please check the giveaway ID.',
                    ephemeral: true
                });
            }

            if (giveaway.status !== 'active') {
                return await interaction.reply({
                    content: '❌ This giveaway is not active and cannot be cancelled.',
                    ephemeral: true
                });
            }

            // Check if user is the host or has admin permissions
            if (giveaway.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ You can only cancel giveaways that you created!',
                    ephemeral: true
                });
            }

            // Cancel the giveaway
            const success = giveawayManager.cancelGiveaway(giveawayId);

            if (!success) {
                return await interaction.reply({
                    content: '❌ Failed to cancel the giveaway. It may have already ended.',
                    ephemeral: true
                });
            }

            // Update the giveaway message
            try {
                const channel = await interaction.client.channels.fetch(giveaway.channelId);
                const message = await channel.messages.fetch(giveaway.messageId);

                const embed = new EmbedBuilder()
                    .setTitle(`🚫 ${giveaway.title} - CANCELLED`)
                    .setColor(0xFF0000)
                    .addFields(
                        { name: '🏆 Prize', value: giveaway.prize, inline: true },
                        { name: '👥 Participants', value: giveaway.participants.length.toString(), inline: true },
                        { name: '🎯 Hosted by', value: `<@${giveaway.hostId}>`, inline: true },
                        { name: '🚫 Cancelled by', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Giveaway ID: ${giveaway.id}` });

                if (giveaway.description) {
                    embed.setDescription(giveaway.description);
                }

                // Remove the join button
                await message.edit({ embeds: [embed], components: [] });

                // Send cancellation message
                await channel.send(`🚫 **Giveaway Cancelled!**\n\nThe giveaway for **${giveaway.prize}** has been cancelled by <@${interaction.user.id}>.`);

            } catch (error) {
                console.error('Error updating cancelled giveaway message:', error);
            }

            await interaction.reply({
                content: `✅ Giveaway **${giveaway.title}** has been cancelled successfully.`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error cancelling giveaway:', error);
            await interaction.reply({
                content: '❌ An error occurred while cancelling the giveaway.',
                ephemeral: true
            });
        }
    },
};

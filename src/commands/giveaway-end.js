const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const giveawayManager = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway-end')
        .setDescription('End an active giveaway early')
        .addStringOption(option =>
            option.setName('giveaway_id')
                .setDescription('The ID of the giveaway to end')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ You do not have permission to end giveaways!',
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
                    content: '❌ This giveaway is not active and cannot be ended.',
                    ephemeral: true
                });
            }

            // Check if user is the host or has admin permissions
            if (giveaway.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ You can only end giveaways that you created!',
                    ephemeral: true
                });
            }

            // End the giveaway
            const result = giveawayManager.endGiveaway(giveawayId);

            if (!result) {
                return await interaction.reply({
                    content: '❌ Failed to end the giveaway. It may have already ended.',
                    ephemeral: true
                });
            }

            const { giveaway: endedGiveaway, winners, participantCount } = result;

            // Update the giveaway message
            try {
                const channel = await interaction.client.channels.fetch(endedGiveaway.channelId);
                const message = await channel.messages.fetch(endedGiveaway.messageId);

                const embed = new EmbedBuilder()
                    .setTitle(`🎉 ${endedGiveaway.title} - ENDED`)
                    .setColor(0xFF0000)
                    .addFields(
                        { name: '🏆 Prize', value: endedGiveaway.prize, inline: true },
                        { name: '👥 Total Participants', value: participantCount.toString(), inline: true },
                        { name: '🎯 Hosted by', value: `<@${endedGiveaway.hostId}>`, inline: true },
                        { name: '⚡ Ended early by', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Giveaway ID: ${endedGiveaway.id}` });

                if (endedGiveaway.description) {
                    embed.setDescription(endedGiveaway.description);
                }

                if (winners.length > 0) {
                    const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                    embed.addFields({ name: '🏆 Winners', value: winnerMentions, inline: false });
                } else {
                    embed.addFields({ name: '🏆 Winners', value: 'No participants', inline: false });
                }

                // Remove the join button
                await message.edit({ embeds: [embed], components: [] });

                // Announce winners
                if (winners.length > 0) {
                    const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
                    await channel.send(`🎉 **Giveaway Ended Early!**\n\nCongratulations ${winnerMentions}! You won **${endedGiveaway.prize}**!\n\n*Giveaway ended early by <@${interaction.user.id}>*`);
                } else {
                    await channel.send(`🎉 **Giveaway Ended Early!**\n\nNo one participated in the giveaway for **${endedGiveaway.prize}**.\n\n*Giveaway ended early by <@${interaction.user.id}>*`);
                }

            } catch (error) {
                console.error('Error updating ended giveaway message:', error);
            }

            await interaction.reply({
                content: `✅ Giveaway **${endedGiveaway.title}** has been ended successfully.${winners.length > 0 ? ` Winners: ${winners.map(id => `<@${id}>`).join(', ')}` : ' No participants.'}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error ending giveaway:', error);
            await interaction.reply({
                content: '❌ An error occurred while ending the giveaway.',
                ephemeral: true
            });
        }
    },
};

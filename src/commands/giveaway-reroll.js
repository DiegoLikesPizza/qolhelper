const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const giveawayManager = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway-reroll')
        .setDescription('Reroll winners for an ended giveaway')
        .addStringOption(option =>
            option.setName('giveaway_id')
                .setDescription('The ID of the giveaway to reroll')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winner_count')
                .setDescription('Number of new winners to select (optional)')
                .setMinValue(1)
                .setMaxValue(20)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ You do not have permission to reroll giveaways!',
                ephemeral: true
            });
        }

        const giveawayId = interaction.options.getString('giveaway_id');
        const newWinnerCount = interaction.options.getInteger('winner_count');

        try {
            const giveaway = giveawayManager.getGiveaway(giveawayId);

            if (!giveaway) {
                return await interaction.reply({
                    content: '❌ Giveaway not found! Please check the giveaway ID.',
                    ephemeral: true
                });
            }

            if (giveaway.status !== 'ended') {
                return await interaction.reply({
                    content: '❌ This giveaway has not ended yet and cannot be rerolled.',
                    ephemeral: true
                });
            }

            // Check if user is the host or has admin permissions
            if (giveaway.hostId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: '❌ You can only reroll giveaways that you created!',
                    ephemeral: true
                });
            }

            if (giveaway.participants.length === 0) {
                return await interaction.reply({
                    content: '❌ Cannot reroll a giveaway with no participants!',
                    ephemeral: true
                });
            }

            // Use provided winner count or original winner count
            const winnerCount = newWinnerCount || giveaway.winnerCount;

            // Select new winners
            const newWinners = giveawayManager.selectWinners(giveaway.participants, winnerCount);

            // Update giveaway with new winners
            giveawayManager.updateGiveaway(giveawayId, { 
                winners: newWinners,
                rerolledAt: Date.now(),
                rerolledBy: interaction.user.id
            });

            // Update the giveaway message
            try {
                const channel = await interaction.client.channels.fetch(giveaway.channelId);
                const message = await channel.messages.fetch(giveaway.messageId);

                const embed = new EmbedBuilder()
                    .setTitle(`🎉 ${giveaway.title} - ENDED (REROLLED)`)
                    .setColor(0x00FF00)
                    .addFields(
                        { name: '🏆 Prize', value: giveaway.prize, inline: true },
                        { name: '👥 Total Participants', value: giveaway.participants.length.toString(), inline: true },
                        { name: '🎯 Hosted by', value: `<@${giveaway.hostId}>`, inline: true },
                        { name: '🔄 Rerolled by', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Giveaway ID: ${giveaway.id}` });

                if (giveaway.description) {
                    embed.setDescription(giveaway.description);
                }

                if (newWinners.length > 0) {
                    const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');
                    embed.addFields({ name: '🏆 New Winners', value: winnerMentions, inline: false });
                } else {
                    embed.addFields({ name: '🏆 New Winners', value: 'No participants', inline: false });
                }

                await message.edit({ embeds: [embed], components: [] });

                // Announce new winners
                if (newWinners.length > 0) {
                    const winnerMentions = newWinners.map(id => `<@${id}>`).join(', ');
                    await channel.send(`🔄 **Giveaway Rerolled!**\n\nNew winners for **${giveaway.prize}**: ${winnerMentions}!\n\n*Rerolled by <@${interaction.user.id}>*`);
                } else {
                    await channel.send(`🔄 **Giveaway Rerolled!**\n\nNo new winners could be selected for **${giveaway.prize}**.\n\n*Rerolled by <@${interaction.user.id}>*`);
                }

            } catch (error) {
                console.error('Error updating rerolled giveaway message:', error);
            }

            await interaction.reply({
                content: `✅ Giveaway **${giveaway.title}** has been rerolled successfully.${newWinners.length > 0 ? ` New winners: ${newWinners.map(id => `<@${id}>`).join(', ')}` : ' No new winners selected.'}`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            await interaction.reply({
                content: '❌ An error occurred while rerolling the giveaway.',
                ephemeral: true
            });
        }
    },
};

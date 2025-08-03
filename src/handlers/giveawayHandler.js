const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const giveawayManager = require('../utils/giveawayManager');

/**
 * Handles giveaway form submission from modal
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 */
async function handleGiveawayFormSubmission(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Get form data
        const title = interaction.fields.getTextInputValue('giveaway_title').trim();
        const prize = interaction.fields.getTextInputValue('giveaway_prize').trim();
        const description = interaction.fields.getTextInputValue('giveaway_description')?.trim() || '';
        const durationInput = interaction.fields.getTextInputValue('giveaway_duration').trim();
        const winnersInput = interaction.fields.getTextInputValue('giveaway_winners')?.trim() || '1';

        // Validate inputs
        if (!title) {
            return await interaction.editReply({ content: '❌ Giveaway title is required!' });
        }

        if (!prize) {
            return await interaction.editReply({ content: '❌ Prize description is required!' });
        }

        // Validate duration
        const duration = parseInt(durationInput);
        if (isNaN(duration) || duration < 1 || duration > 10080) { // Max 1 week
            return await interaction.editReply({ 
                content: '❌ Duration must be a number between 1 and 10080 minutes (1 week)!' 
            });
        }

        // Validate winner count
        const winnerCount = parseInt(winnersInput);
        if (isNaN(winnerCount) || winnerCount < 1 || winnerCount > 20) {
            return await interaction.editReply({ 
                content: '❌ Number of winners must be between 1 and 20!' 
            });
        }

        // Create giveaway data
        const giveawayData = {
            title,
            description,
            prize,
            winnerCount,
            duration,
            requiredRoles: [], // TODO: Add role requirement support in future
            channelId: interaction.channel.id,
            hostId: interaction.user.id
        };

        // Create the giveaway
        const giveawayId = giveawayManager.createGiveaway(giveawayData);
        const giveaway = giveawayManager.getGiveaway(giveawayId);

        // Create the giveaway embed
        const embed = createGiveawayEmbed(giveaway);

        // Create the join button
        const joinButton = new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveawayId}`)
            .setLabel('🎉 Join Giveaway')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(joinButton);

        // Post the giveaway message
        const giveawayMessage = await interaction.channel.send({
            embeds: [embed],
            components: [actionRow]
        });

        // Update giveaway with message ID
        giveawayManager.updateGiveaway(giveawayId, { messageId: giveawayMessage.id });

        // Schedule the giveaway to end
        scheduleGiveawayEnd(interaction.client, giveawayId, duration);

        // Send success message
        await interaction.editReply({
            content: `✅ Giveaway created successfully!\n🔗 ${giveawayMessage.url}`
        });

    } catch (error) {
        console.error('Error handling giveaway form submission:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the giveaway. Please try again later.'
        });
    }
}

/**
 * Handles giveaway button interactions
 * @param {import('discord.js').ButtonInteraction} interaction
 */
async function handleGiveawayButtonInteraction(interaction) {
    // Custom ID format: giveaway_join_${giveawayId}
    const parts = interaction.customId.split('_');
    const action = parts[1]; // 'join'
    const giveawayId = parts.slice(2).join('_'); // Everything after 'giveaway_join_'

    if (action === 'join') {
        await handleJoinGiveaway(interaction, giveawayId);
    }
}

/**
 * Handles joining a giveaway
 * @param {import('discord.js').ButtonInteraction} interaction 
 * @param {string} giveawayId 
 */
async function handleJoinGiveaway(interaction, giveawayId) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const giveaway = giveawayManager.getGiveaway(giveawayId);

        if (!giveaway) {
            return await interaction.editReply({ content: '❌ Giveaway not found!' });
        }

        if (giveaway.status !== 'active') {
            return await interaction.editReply({ content: '❌ This giveaway is no longer active!' });
        }

        // Check if giveaway has ended
        if (Date.now() >= giveaway.endsAt) {
            return await interaction.editReply({ content: '❌ This giveaway has already ended!' });
        }

        // Check if user is already participating
        if (giveaway.participants.includes(interaction.user.id)) {
            return await interaction.editReply({ content: '❌ You are already participating in this giveaway!' });
        }

        // TODO: Check role requirements if any
        // if (giveaway.requiredRoles.length > 0) {
        //     const member = interaction.member;
        //     const hasRequiredRole = giveaway.requiredRoles.some(roleId => 
        //         member.roles.cache.has(roleId)
        //     );
        //     if (!hasRequiredRole) {
        //         return await interaction.editReply({ 
        //             content: '❌ You do not have the required roles to join this giveaway!' 
        //         });
        //     }
        // }

        // Add participant
        const success = giveawayManager.addParticipant(giveawayId, interaction.user.id);

        if (success) {
            await interaction.editReply({ content: '✅ You have successfully joined the giveaway!' });
            
            // Update the giveaway message with new participant count
            await updateGiveawayMessage(interaction.client, giveaway);
        } else {
            await interaction.editReply({ content: '❌ Failed to join the giveaway. Please try again.' });
        }

    } catch (error) {
        console.error('Error handling join giveaway:', error);
        await interaction.editReply({ content: '❌ An error occurred while joining the giveaway.' });
    }
}

/**
 * Creates a giveaway embed
 * @param {Object} giveaway Giveaway data
 * @returns {EmbedBuilder} Giveaway embed
 */
function createGiveawayEmbed(giveaway) {
    const embed = new EmbedBuilder()
        .setTitle(`🎉 ${giveaway.title}`)
        .setColor(0x00FF00)
        .addFields(
            { name: '🏆 Prize', value: giveaway.prize, inline: true },
            { name: '👥 Winners', value: giveaway.winnerCount.toString(), inline: true },
            { name: '👤 Participants', value: giveaway.participants.length.toString(), inline: true },
            { name: '⏰ Ends', value: `<t:${Math.floor(giveaway.endsAt / 1000)}:R>`, inline: true },
            { name: '🎯 Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
        )
        .setTimestamp(giveaway.endsAt)
        .setFooter({ text: `Giveaway ID: ${giveaway.id}` });

    if (giveaway.description) {
        embed.setDescription(giveaway.description);
    }

    return embed;
}

/**
 * Updates a giveaway message with current data
 * @param {import('discord.js').Client} client 
 * @param {Object} giveaway 
 */
async function updateGiveawayMessage(client, giveaway) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);
        
        const embed = createGiveawayEmbed(giveaway);
        
        await message.edit({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating giveaway message:', error);
    }
}

/**
 * Schedules a giveaway to end after the specified duration
 * @param {import('discord.js').Client} client 
 * @param {string} giveawayId 
 * @param {number} durationMinutes 
 */
function scheduleGiveawayEnd(client, giveawayId, durationMinutes) {
    const durationMs = durationMinutes * 60 * 1000;
    
    setTimeout(async () => {
        await endGiveawayAutomatically(client, giveawayId);
    }, durationMs);
}

/**
 * Automatically ends a giveaway and announces winners
 * @param {import('discord.js').Client} client 
 * @param {string} giveawayId 
 */
async function endGiveawayAutomatically(client, giveawayId) {
    try {
        const result = giveawayManager.endGiveaway(giveawayId);
        
        if (!result) {
            console.log(`Failed to end giveaway ${giveawayId} - may already be ended or cancelled`);
            return;
        }

        const { giveaway, winners, participantCount } = result;
        
        // Get the channel and message
        const channel = await client.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(giveaway.messageId);

        // Create ended giveaway embed
        const embed = new EmbedBuilder()
            .setTitle(`🎉 ${giveaway.title} - ENDED`)
            .setColor(0xFF0000)
            .addFields(
                { name: '🏆 Prize', value: giveaway.prize, inline: true },
                { name: '👥 Total Participants', value: participantCount.toString(), inline: true },
                { name: '🎯 Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Giveaway ID: ${giveaway.id}` });

        if (giveaway.description) {
            embed.setDescription(giveaway.description);
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
            await channel.send(`🎉 **Giveaway Ended!**\n\nCongratulations ${winnerMentions}! You won **${giveaway.prize}**!`);
        } else {
            await channel.send(`🎉 **Giveaway Ended!**\n\nNo one participated in the giveaway for **${giveaway.prize}**.`);
        }

    } catch (error) {
        console.error('Error ending giveaway automatically:', error);
    }
}

module.exports = {
    handleGiveawayFormSubmission,
    handleGiveawayButtonInteraction,
    createGiveawayEmbed,
    updateGiveawayMessage,
    endGiveawayAutomatically
};

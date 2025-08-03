const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayManager = require('../utils/giveawayManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway-list')
        .setDescription('List all active giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Check if the user has permission to manage messages
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return await interaction.reply({
                content: '❌ You do not have permission to list giveaways!',
                ephemeral: true
            });
        }

        try {
            const activeGiveaways = giveawayManager.getActiveGiveaways();

            if (activeGiveaways.length === 0) {
                return await interaction.reply({
                    content: '📋 There are currently no active giveaways.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Active Giveaways')
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: `Total: ${activeGiveaways.length} active giveaway${activeGiveaways.length !== 1 ? 's' : ''}` });

            // Add fields for each giveaway (limit to 10 to avoid embed limits)
            const giveawaysToShow = activeGiveaways.slice(0, 10);
            
            for (const giveaway of giveawaysToShow) {
                const timeLeft = Math.max(0, giveaway.endsAt - Date.now());
                const timeLeftStr = timeLeft > 0 ? `<t:${Math.floor(giveaway.endsAt / 1000)}:R>` : 'Ending soon...';
                
                embed.addFields({
                    name: `🎉 ${giveaway.title}`,
                    value: `**Prize:** ${giveaway.prize}\n**Participants:** ${giveaway.participants.length}\n**Ends:** ${timeLeftStr}\n**ID:** \`${giveaway.id}\``,
                    inline: true
                });
            }

            if (activeGiveaways.length > 10) {
                embed.setDescription(`Showing first 10 of ${activeGiveaways.length} active giveaways.`);
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error listing giveaways:', error);
            await interaction.reply({
                content: '❌ An error occurred while listing giveaways.',
                ephemeral: true
            });
        }
    },
};

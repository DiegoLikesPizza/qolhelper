const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Validates if a string is a valid URL
 * @param {string} string 
 * @returns {boolean}
 */
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Formats a Discord invite link
 * @param {string} invite 
 * @returns {string}
 */
function formatDiscordInvite(invite) {
    if (!invite) return null;
    
    // Remove any existing discord.gg/ or discord.com/invite/ prefixes
    const cleanInvite = invite.replace(/^(https?:\/\/)?(discord\.gg\/|discord\.com\/invite\/)/i, '');
    
    // Return formatted invite
    return `https://discord.gg/${cleanInvite}`;
}

/**
 * Validates and formats a website/GitHub link
 * @param {string} link 
 * @returns {string|null}
 */
function formatWebsiteLink(link) {
    if (!link) return null;
    
    // Add https:// if no protocol is specified
    if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
    }
    
    // Validate the URL
    if (!isValidUrl(link)) {
        return null;
    }
    
    return link;
}

/**
 * Gets the appropriate forum channel ID based on client type and version
 * @param {string} clientType
 * @param {string} version
 * @returns {string|null}
 */
function getForumChannelId(clientType, version) {
    // Normalize version string for channel lookup
    const versionKey = version === '1.8.9' ? '189' : '1215';

    switch (clientType) {
        case 'cheat':
            return version === '1.8.9' ? config.channels.cheatForum189 : config.channels.cheatForum1215;
        case 'macro':
            return version === '1.8.9' ? config.channels.macroForum189 : config.channels.macroForum1215;
        case 'legit':
            return version === '1.8.9' ? config.channels.legitForum189 : config.channels.legitForum1215;
        default:
            return null;
    }
}

/**
 * Creates a forum post for the submitted client
 * @param {import('discord.js').Client} client 
 * @param {string} channelId 
 * @param {Object} clientData 
 * @returns {Promise<import('discord.js').ThreadChannel>}
 */
async function createForumPost(client, channelId, clientData) {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isThreadOnly()) {
        throw new Error('Invalid forum channel');
    }

    // Create the thread title with the format "[free/paid] name"
    const priceTag = clientData.isFree ? 'FREE' : 'PAID';
    const threadName = `[${priceTag}] ${clientData.name}`;

    // Create the initial message content
    let messageContent = `**${clientData.name}** - Minecraft ${clientData.version}\n\n`;
    
    if (clientData.discordInvite) {
        messageContent += `🔗 **Discord Server:** ${clientData.discordInvite}\n`;
    }
    
    if (clientData.websiteLink) {
        messageContent += `🌐 **Website/GitHub:** ${clientData.websiteLink}\n`;
    }

    // Create an embed for better formatting
    const embed = new EmbedBuilder()
        .setTitle(`${clientData.name}`)
        .setColor(clientData.isFree ? 0x00FF00 : 0xFF6B00) // Green for free, orange for paid
        .addFields(
            { name: 'Minecraft Version', value: clientData.version, inline: true },
            { name: 'Price', value: clientData.isFree ? 'Free' : 'Paid', inline: true },
            { name: 'Type', value: clientData.type.charAt(0).toUpperCase() + clientData.type.slice(1), inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Submitted by ${clientData.submittedBy}` });

    if (clientData.discordInvite) {
        embed.addFields({ name: 'Discord Server', value: clientData.discordInvite, inline: false });
    }

    if (clientData.websiteLink) {
        embed.addFields({ name: 'Website/GitHub', value: clientData.websiteLink, inline: false });
    }

    // Create the forum post
    const thread = await channel.threads.create({
        name: threadName,
        message: {
            content: messageContent,
            embeds: [embed]
        }
    });

    return thread;
}

/**
 * Handles client form submission from modals
 * @param {import('discord.js').ModalSubmitInteraction} interaction 
 */
async function handleClientFormSubmission(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Extract client type from custom ID
        const clientType = interaction.customId.split('_')[2]; // client_form_cheat -> cheat

        // Get form data
        const name = interaction.fields.getTextInputValue('client_name').trim();
        const version = interaction.fields.getTextInputValue('client_version').trim();
        const freeResponse = interaction.fields.getTextInputValue('client_free').trim().toLowerCase();
        const discordInvite = interaction.fields.getTextInputValue('client_discord')?.trim() || '';
        const websiteLink = interaction.fields.getTextInputValue('client_link')?.trim() || '';

        // Validate inputs
        if (!name) {
            return await interaction.editReply({ content: '❌ Client name is required!' });
        }

        if (!['1.8.9', '1.21.5'].includes(version)) {
            return await interaction.editReply({ content: '❌ Version must be either 1.8.9 or 1.21.5!' });
        }

        if (!['yes', 'no', 'y', 'n'].includes(freeResponse)) {
            return await interaction.editReply({ content: '❌ Please answer "yes" or "no" for the free question!' });
        }

        const isFree = ['yes', 'y'].includes(freeResponse);

        // Format and validate links
        const formattedDiscordInvite = discordInvite ? formatDiscordInvite(discordInvite) : null;
        const formattedWebsiteLink = websiteLink ? formatWebsiteLink(websiteLink) : null;

        if (discordInvite && !formattedDiscordInvite) {
            return await interaction.editReply({ content: '❌ Invalid Discord invite format!' });
        }

        if (websiteLink && !formattedWebsiteLink) {
            return await interaction.editReply({ content: '❌ Invalid website/GitHub link format!' });
        }

        // Get the appropriate forum channel based on type and version
        const forumChannelId = getForumChannelId(clientType, version);
        if (!forumChannelId) {
            return await interaction.editReply({
                content: `❌ Forum channel not configured for ${clientType} clients on Minecraft ${version}!`
            });
        }

        // Prepare client data
        const clientData = {
            name,
            version,
            isFree,
            type: clientType,
            discordInvite: formattedDiscordInvite,
            websiteLink: formattedWebsiteLink,
            submittedBy: interaction.user.tag
        };

        // Create the forum post
        const thread = await createForumPost(interaction.client, forumChannelId, clientData);

        // Send success message
        await interaction.editReply({
            content: `✅ Successfully created forum post for **${name}**!\n🔗 ${thread.url}`
        });

    } catch (error) {
        console.error('Error handling client form submission:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the forum post. Please try again later.'
        });
    }
}

module.exports = {
    handleClientFormSubmission
};

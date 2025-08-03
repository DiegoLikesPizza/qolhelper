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
    // Handle non-versioned types
    if (clientType === 'coinshop') {
        return config.channels.coinShopForum;
    }
    if (clientType === 'other') {
        return config.channels.otherForum;
    }

    // Handle versioned client types
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

    // Create the thread title with the price and name
    const threadName = `[${clientData.price}] ${clientData.name}`;

    // Create an embed for better formatting
    const embed = new EmbedBuilder()
        .setTitle(`${clientData.name}`)
        .setColor(0x5865F2) // Discord blurple color
        .addFields(
            { name: 'Price', value: clientData.price, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Submitted by ${clientData.submittedBy}` });

    if (clientData.description) {
        embed.setDescription(clientData.description);
    }

    if (clientData.discordInvite) {
        embed.addFields({ name: 'Discord Server', value: clientData.discordInvite, inline: false });
    }

    // Create the forum post
    const thread = await channel.threads.create({
        name: threadName,
        message: {
            embeds: [embed]
        }
    });

    return thread;
}

/**
 * Creates a forum post for a coin shop
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {Object} shopData
 * @returns {Promise<import('discord.js').ThreadChannel>}
 */
async function createCoinShopForumPost(client, channelId, shopData) {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isThreadOnly()) {
        throw new Error('Invalid forum channel');
    }

    // Create the thread title
    const threadName = `💰 ${shopData.name}`;

    // Create an embed for better formatting
    const embed = new EmbedBuilder()
        .setTitle(`💰 ${shopData.name}`)
        .setColor(0xFFD700) // Gold color for coin shops
        .setDescription(shopData.description)
        .addFields(
            { name: '💵 Pricing', value: shopData.prices, inline: false },
            { name: '💬 Contact', value: shopData.discord, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Submitted by ${shopData.submittedBy}` });

    if (shopData.link) {
        embed.addFields({ name: '🌐 Website/Payment', value: shopData.link, inline: false });
    }

    // Create the forum post
    const thread = await channel.threads.create({
        name: threadName,
        message: {
            embeds: [embed]
        }
    });

    return thread;
}

/**
 * Creates a forum post for other items
 * @param {import('discord.js').Client} client
 * @param {string} channelId
 * @param {Object} itemData
 * @returns {Promise<import('discord.js').ThreadChannel>}
 */
async function createOtherForumPost(client, channelId, itemData) {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isThreadOnly()) {
        throw new Error('Invalid forum channel');
    }

    // Create the thread title
    const threadName = `${itemData.category} - ${itemData.name}`;

    // Create an embed for better formatting
    const embed = new EmbedBuilder()
        .setTitle(`${itemData.name}`)
        .setColor(0x9932CC) // Purple color for other items
        .setDescription(itemData.description)
        .addFields(
            { name: '📋 Category', value: itemData.category, inline: true },
            { name: '💰 Price', value: itemData.price, inline: true },
            { name: '📞 Contact', value: itemData.contact, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Submitted by ${itemData.submittedBy}` });

    // Create the forum post
    const thread = await channel.threads.create({
        name: threadName,
        message: {
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
        const price = interaction.fields.getTextInputValue('client_price').trim();
        const description = interaction.fields.getTextInputValue('client_description')?.trim() || '';
        const discordInvite = interaction.fields.getTextInputValue('client_discord')?.trim() || '';

        // Validate inputs
        if (!name) {
            return await interaction.editReply({ content: '❌ Client name is required!' });
        }

        if (!['1.8.9', '1.21.5'].includes(version)) {
            return await interaction.editReply({ content: '❌ Version must be either 1.8.9 or 1.21.5!' });
        }

        if (!price) {
            return await interaction.editReply({ content: '❌ Price is required!' });
        }

        // Format and validate Discord invite
        const formattedDiscordInvite = discordInvite ? formatDiscordInvite(discordInvite) : null;

        if (discordInvite && !formattedDiscordInvite) {
            return await interaction.editReply({ content: '❌ Invalid Discord invite format!' });
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
            price,
            description,
            type: clientType,
            discordInvite: formattedDiscordInvite,
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

/**
 * Handles coin shop form submission from modal
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleCoinShopFormSubmission(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Get form data
        const name = interaction.fields.getTextInputValue('shop_name').trim();
        const description = interaction.fields.getTextInputValue('shop_description').trim();
        const prices = interaction.fields.getTextInputValue('shop_prices').trim();
        const discord = interaction.fields.getTextInputValue('shop_discord').trim();
        const link = interaction.fields.getTextInputValue('shop_link')?.trim() || '';

        // Validate inputs
        if (!name) {
            return await interaction.editReply({ content: '❌ Shop name is required!' });
        }

        if (!description) {
            return await interaction.editReply({ content: '❌ Description is required!' });
        }

        if (!prices) {
            return await interaction.editReply({ content: '❌ Pricing information is required!' });
        }

        if (!discord) {
            return await interaction.editReply({ content: '❌ Discord contact is required!' });
        }

        // Format website link if provided
        const formattedLink = link ? formatWebsiteLink(link) : null;
        if (link && !formattedLink) {
            return await interaction.editReply({ content: '❌ Invalid website/payment link format!' });
        }

        // Get the forum channel
        const forumChannelId = getForumChannelId('coinshop');
        if (!forumChannelId) {
            return await interaction.editReply({
                content: '❌ Coin shop forum channel not configured!'
            });
        }

        // Prepare shop data
        const shopData = {
            name,
            description,
            prices,
            discord,
            link: formattedLink,
            type: 'coinshop',
            submittedBy: interaction.user.tag
        };

        // Create the forum post
        const thread = await createCoinShopForumPost(interaction.client, forumChannelId, shopData);

        // Send success message
        await interaction.editReply({
            content: `✅ Successfully created coin shop listing for **${name}**!\n🔗 ${thread.url}`
        });

    } catch (error) {
        console.error('Error handling coin shop form submission:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the coin shop listing. Please try again later.'
        });
    }
}

/**
 * Handles other items form submission from modal
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 */
async function handleOtherFormSubmission(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Get form data
        const name = interaction.fields.getTextInputValue('item_name').trim();
        const category = interaction.fields.getTextInputValue('item_category').trim();
        const description = interaction.fields.getTextInputValue('item_description').trim();
        const price = interaction.fields.getTextInputValue('item_price').trim();
        const contact = interaction.fields.getTextInputValue('item_contact').trim();

        // Validate inputs
        if (!name) {
            return await interaction.editReply({ content: '❌ Item/service name is required!' });
        }

        if (!category) {
            return await interaction.editReply({ content: '❌ Category is required!' });
        }

        if (!description) {
            return await interaction.editReply({ content: '❌ Description is required!' });
        }

        if (!price) {
            return await interaction.editReply({ content: '❌ Price information is required!' });
        }

        if (!contact) {
            return await interaction.editReply({ content: '❌ Contact information is required!' });
        }

        // Get the forum channel
        const forumChannelId = getForumChannelId('other');
        if (!forumChannelId) {
            return await interaction.editReply({
                content: '❌ Other items forum channel not configured!'
            });
        }

        // Prepare item data
        const itemData = {
            name,
            category,
            description,
            price,
            contact,
            type: 'other',
            submittedBy: interaction.user.tag
        };

        // Create the forum post
        const thread = await createOtherForumPost(interaction.client, forumChannelId, itemData);

        // Send success message
        await interaction.editReply({
            content: `✅ Successfully created listing for **${name}**!\n🔗 ${thread.url}`
        });

    } catch (error) {
        console.error('Error handling other form submission:', error);
        await interaction.editReply({
            content: '❌ An error occurred while creating the listing. Please try again later.'
        });
    }
}

module.exports = {
    handleClientFormSubmission,
    handleCoinShopFormSubmission,
    handleOtherFormSubmission
};

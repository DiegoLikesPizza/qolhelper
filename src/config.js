require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Role permissions
    roles: {
        clientListing: process.env.CLIENT_LISTING_ROLE_ID
    },

    channels: {
        // Version-specific forum channels
        cheatForum189: process.env.CHEAT_FORUM_189_CHANNEL_ID,
        cheatForum1215: process.env.CHEAT_FORUM_1215_CHANNEL_ID,
        macroForum189: process.env.MACRO_FORUM_189_CHANNEL_ID,
        macroForum1215: process.env.MACRO_FORUM_1215_CHANNEL_ID,
        legitForum189: process.env.LEGIT_FORUM_189_CHANNEL_ID,
        legitForum1215: process.env.LEGIT_FORUM_1215_CHANNEL_ID,

        // Additional forum channels
        coinShopForum: process.env.COIN_SHOP_FORUM_CHANNEL_ID,
        otherForum: process.env.OTHER_FORUM_CHANNEL_ID,

        // Legacy support (for backward compatibility)
        cheatForum: process.env.CHEAT_FORUM_CHANNEL_ID,
        macroForum: process.env.MACRO_FORUM_CHANNEL_ID,
        legitForum: process.env.LEGIT_FORUM_CHANNEL_ID
    }
};

const config = require('../config');

/**
 * Checks if a member has the required role for client listing
 * @param {import('discord.js').GuildMember} member 
 * @returns {boolean} Whether the member has the required role
 */
function hasClientListingPermission(member) {
    // If no role is configured, allow everyone
    if (!config.roles.clientListing) {
        return true;
    }
    
    // Check if member has the required role
    return member.roles.cache.has(config.roles.clientListing);
}

/**
 * Gets the name of the required role for client listing
 * @param {import('discord.js').Guild} guild 
 * @returns {string|null} Role name or null if not configured
 */
function getClientListingRoleName(guild) {
    if (!config.roles.clientListing) {
        return null;
    }
    
    const role = guild.roles.cache.get(config.roles.clientListing);
    return role ? role.name : 'Unknown Role';
}

module.exports = {
    hasClientListingPermission,
    getClientListingRoleName
};

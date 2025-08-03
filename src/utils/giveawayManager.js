const fs = require('fs');
const path = require('path');

const GIVEAWAYS_FILE = path.join(__dirname, '../data/giveaways.json');

/**
 * Ensures the giveaways data file exists
 */
function ensureDataFile() {
    const dataDir = path.dirname(GIVEAWAYS_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(GIVEAWAYS_FILE)) {
        fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify({ giveaways: {} }, null, 2));
    }
}

/**
 * Loads giveaway data from file
 * @returns {Object} Giveaway data
 */
function loadGiveaways() {
    ensureDataFile();
    try {
        const data = fs.readFileSync(GIVEAWAYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading giveaways:', error);
        return { giveaways: {} };
    }
}

/**
 * Saves giveaway data to file
 * @param {Object} data Giveaway data to save
 */
function saveGiveaways(data) {
    try {
        fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving giveaways:', error);
    }
}

/**
 * Creates a new giveaway
 * @param {Object} giveawayData Giveaway configuration
 * @returns {string} Giveaway ID
 */
function createGiveaway(giveawayData) {
    const data = loadGiveaways();
    const giveawayId = generateGiveawayId();
    
    const giveaway = {
        id: giveawayId,
        title: giveawayData.title,
        description: giveawayData.description,
        prize: giveawayData.prize,
        winnerCount: giveawayData.winnerCount,
        duration: giveawayData.duration, // in minutes
        requiredRoles: giveawayData.requiredRoles || [],
        channelId: giveawayData.channelId,
        messageId: null, // Will be set when message is posted
        hostId: giveawayData.hostId,
        participants: [],
        status: 'active', // active, ended, cancelled
        createdAt: Date.now(),
        endsAt: Date.now() + (giveawayData.duration * 60 * 1000),
        winners: []
    };
    
    data.giveaways[giveawayId] = giveaway;
    saveGiveaways(data);
    
    return giveawayId;
}

/**
 * Gets a giveaway by ID
 * @param {string} giveawayId 
 * @returns {Object|null} Giveaway data or null if not found
 */
function getGiveaway(giveawayId) {
    const data = loadGiveaways();
    return data.giveaways[giveawayId] || null;
}

/**
 * Updates a giveaway
 * @param {string} giveawayId 
 * @param {Object} updates 
 * @returns {boolean} Success status
 */
function updateGiveaway(giveawayId, updates) {
    const data = loadGiveaways();
    if (!data.giveaways[giveawayId]) {
        return false;
    }
    
    data.giveaways[giveawayId] = { ...data.giveaways[giveawayId], ...updates };
    saveGiveaways(data);
    return true;
}

/**
 * Adds a participant to a giveaway
 * @param {string} giveawayId 
 * @param {string} userId 
 * @returns {boolean} Success status
 */
function addParticipant(giveawayId, userId) {
    const data = loadGiveaways();
    const giveaway = data.giveaways[giveawayId];
    
    if (!giveaway || giveaway.status !== 'active') {
        return false;
    }
    
    if (!giveaway.participants.includes(userId)) {
        giveaway.participants.push(userId);
        saveGiveaways(data);
    }
    
    return true;
}

/**
 * Removes a participant from a giveaway
 * @param {string} giveawayId 
 * @param {string} userId 
 * @returns {boolean} Success status
 */
function removeParticipant(giveawayId, userId) {
    const data = loadGiveaways();
    const giveaway = data.giveaways[giveawayId];
    
    if (!giveaway) {
        return false;
    }
    
    const index = giveaway.participants.indexOf(userId);
    if (index > -1) {
        giveaway.participants.splice(index, 1);
        saveGiveaways(data);
    }
    
    return true;
}

/**
 * Gets all active giveaways
 * @returns {Array} Array of active giveaways
 */
function getActiveGiveaways() {
    const data = loadGiveaways();
    return Object.values(data.giveaways).filter(g => g.status === 'active');
}

/**
 * Gets expired giveaways that need to be ended
 * @returns {Array} Array of expired giveaways
 */
function getExpiredGiveaways() {
    const now = Date.now();
    return getActiveGiveaways().filter(g => g.endsAt <= now);
}

/**
 * Selects random winners from participants
 * @param {Array} participants Array of participant user IDs
 * @param {number} winnerCount Number of winners to select
 * @returns {Array} Array of winner user IDs
 */
function selectWinners(participants, winnerCount) {
    if (participants.length === 0) {
        return [];
    }
    
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(winnerCount, participants.length));
}

/**
 * Ends a giveaway and selects winners
 * @param {string} giveawayId 
 * @returns {Object|null} Result with winners or null if failed
 */
function endGiveaway(giveawayId) {
    const data = loadGiveaways();
    const giveaway = data.giveaways[giveawayId];
    
    if (!giveaway || giveaway.status !== 'active') {
        return null;
    }
    
    const winners = selectWinners(giveaway.participants, giveaway.winnerCount);
    
    giveaway.status = 'ended';
    giveaway.winners = winners;
    giveaway.endedAt = Date.now();
    
    saveGiveaways(data);
    
    return {
        giveaway,
        winners,
        participantCount: giveaway.participants.length
    };
}

/**
 * Cancels a giveaway
 * @param {string} giveawayId 
 * @returns {boolean} Success status
 */
function cancelGiveaway(giveawayId) {
    const data = loadGiveaways();
    const giveaway = data.giveaways[giveawayId];
    
    if (!giveaway || giveaway.status !== 'active') {
        return false;
    }
    
    giveaway.status = 'cancelled';
    giveaway.cancelledAt = Date.now();
    
    saveGiveaways(data);
    return true;
}

/**
 * Generates a unique giveaway ID
 * @returns {string} Unique giveaway ID
 */
function generateGiveawayId() {
    return 'gw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Formats duration for display
 * @param {number} minutes Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
        if (remainingMinutes === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    if (remainingHours === 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return `${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
}

module.exports = {
    createGiveaway,
    getGiveaway,
    updateGiveaway,
    addParticipant,
    removeParticipant,
    getActiveGiveaways,
    getExpiredGiveaways,
    selectWinners,
    endGiveaway,
    cancelGiveaway,
    formatDuration
};

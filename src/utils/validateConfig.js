const config = require('../config');

/**
 * Validates the bot configuration
 * @returns {Object} Validation result with success status and errors
 */
function validateConfig() {
    const errors = [];
    const warnings = [];

    // Check required environment variables
    if (!config.token) {
        errors.push('DISCORD_TOKEN is required');
    }

    if (!config.clientId) {
        errors.push('CLIENT_ID is required');
    }

    if (!config.guildId) {
        errors.push('GUILD_ID is required');
    }

    // Check version-specific forum channel IDs
    if (!config.channels.cheatForum189) {
        warnings.push('CHEAT_FORUM_189_CHANNEL_ID is not set - /listcheat command for 1.8.9 will not work');
    }
    if (!config.channels.cheatForum1215) {
        warnings.push('CHEAT_FORUM_1215_CHANNEL_ID is not set - /listcheat command for 1.21.5 will not work');
    }

    if (!config.channels.macroForum189) {
        warnings.push('MACRO_FORUM_189_CHANNEL_ID is not set - /listmacro command for 1.8.9 will not work');
    }
    if (!config.channels.macroForum1215) {
        warnings.push('MACRO_FORUM_1215_CHANNEL_ID is not set - /listmacro command for 1.21.5 will not work');
    }

    if (!config.channels.legitForum189) {
        warnings.push('LEGIT_FORUM_189_CHANNEL_ID is not set - /listlegit command for 1.8.9 will not work');
    }
    if (!config.channels.legitForum1215) {
        warnings.push('LEGIT_FORUM_1215_CHANNEL_ID is not set - /listlegit command for 1.21.5 will not work');
    }

    // Validate ID formats (Discord IDs are typically 17-19 digits)
    const idPattern = /^\d{17,19}$/;

    if (config.clientId && !idPattern.test(config.clientId)) {
        errors.push('CLIENT_ID appears to be invalid (should be 17-19 digits)');
    }

    if (config.guildId && !idPattern.test(config.guildId)) {
        errors.push('GUILD_ID appears to be invalid (should be 17-19 digits)');
    }

    // Validate version-specific channel IDs
    const channelValidations = [
        { id: config.channels.cheatForum189, name: 'CHEAT_FORUM_189_CHANNEL_ID' },
        { id: config.channels.cheatForum1215, name: 'CHEAT_FORUM_1215_CHANNEL_ID' },
        { id: config.channels.macroForum189, name: 'MACRO_FORUM_189_CHANNEL_ID' },
        { id: config.channels.macroForum1215, name: 'MACRO_FORUM_1215_CHANNEL_ID' },
        { id: config.channels.legitForum189, name: 'LEGIT_FORUM_189_CHANNEL_ID' },
        { id: config.channels.legitForum1215, name: 'LEGIT_FORUM_1215_CHANNEL_ID' },
        // Legacy channels
        { id: config.channels.cheatForum, name: 'CHEAT_FORUM_CHANNEL_ID' },
        { id: config.channels.macroForum, name: 'MACRO_FORUM_CHANNEL_ID' },
        { id: config.channels.legitForum, name: 'LEGIT_FORUM_CHANNEL_ID' }
    ];

    channelValidations.forEach(({ id, name }) => {
        if (id && !idPattern.test(id)) {
            errors.push(`${name} appears to be invalid (should be 17-19 digits)`);
        }
    });

    return {
        success: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Prints configuration validation results
 */
function printValidationResults() {
    console.log('🔍 Validating bot configuration...');
    console.log('='.repeat(40));

    const result = validateConfig();

    if (result.success) {
        console.log('✅ Configuration is valid!');
    } else {
        console.log('❌ Configuration has errors:');
        result.errors.forEach(error => {
            console.log(`   • ${error}`);
        });
    }

    if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(warning => {
            console.log(`   • ${warning}`);
        });
    }

    console.log('='.repeat(40));

    if (!result.success) {
        console.log('\n📝 To fix these issues:');
        console.log('1. Copy .env.example to .env');
        console.log('2. Fill in all required values');
        console.log('3. Run "npm run get-ids" to help find channel and guild IDs');
        console.log('4. Run "npm run deploy" to register slash commands');
    }

    return result;
}

// If this file is run directly, print validation results
if (require.main === module) {
    const result = printValidationResults();
    process.exit(result.success ? 0 : 1);
}

module.exports = {
    validateConfig,
    printValidationResults
};

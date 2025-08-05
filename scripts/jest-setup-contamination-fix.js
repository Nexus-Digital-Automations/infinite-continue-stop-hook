// Jest setup file specifically for contamination prevention
const JestContaminationPrevention = require('./jest-contamination-fix');

// Global contamination prevention instance
let globalContaminationPrevention = null;

// Initialize contamination prevention at Jest startup
async function initializeContaminationPrevention() {
    if (!globalContaminationPrevention) {
        globalContaminationPrevention = new JestContaminationPrevention();
        await globalContaminationPrevention.initialize();
        
        // Make it globally available
        global.__contaminationPrevention = globalContaminationPrevention;
        
        console.log('🛡️ Jest contamination prevention initialized');
    }
}

// Initialize immediately
initializeContaminationPrevention().catch(error => {
    console.warn('Warning: Failed to initialize contamination prevention:', error.message);
});

module.exports = {
    globalContaminationPrevention
};
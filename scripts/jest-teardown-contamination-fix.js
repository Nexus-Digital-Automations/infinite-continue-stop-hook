// Jest global teardown with contamination cleanup
const ContaminationResolver = require('../lib/contaminationResolver');

module.exports = async () => {
    console.log('🧹 Running Jest teardown with contamination cleanup...');
    
    try {
        // Stop any running contamination prevention
        if (global.__contaminationPrevention) {
            await global.__contaminationPrevention.stop();
        }
        
        // Final contamination check and cleanup
        const resolver = new ContaminationResolver();
        await resolver.storeOriginalContents();
        
        const contaminated = await resolver.detectContamination();
        if (contaminated.length > 0) {
            console.log(`🚨 Final cleanup: ${contaminated.length} contaminated files detected`);
            await resolver.restoreContaminatedFiles();
            console.log('✅ Final contamination cleanup completed');
        }
        
        // Give a moment for any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        console.warn('Warning during Jest teardown:', error.message);
    }
    
    console.log('✅ Jest teardown with contamination cleanup completed');
};
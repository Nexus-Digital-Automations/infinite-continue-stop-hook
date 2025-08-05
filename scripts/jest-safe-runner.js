// Custom Jest runner with contamination protection
const { DefaultTestRunner } = require('jest-runner');
const ContaminationResolver = require('../lib/contaminationResolver');

class ContaminationSafeRunner extends DefaultTestRunner {
    constructor(globalConfig, context) {
        super(globalConfig, context);
        this.resolver = new ContaminationResolver();
    }

    async runTests(tests, watcher, onStart, onResult, onFailure, options) {
        // Store original file contents before running tests
        await this.resolver.storeOriginalContents();
        
        try {
            // Run the actual tests
            const result = await super.runTests(tests, watcher, onStart, onResult, onFailure, options);
            
            // Check for contamination after tests complete
            const contaminated = await this.resolver.detectContamination();
            if (contaminated.length > 0) {
                console.log(`🧹 Post-test cleanup: fixing ${contaminated.length} contaminated files`);
                await this.resolver.restoreContaminatedFiles();
            }
            
            return result;
        } catch (error) {
            // Ensure cleanup even if tests fail
            try {
                const contaminated = await this.resolver.detectContamination();
                if (contaminated.length > 0) {
                    await this.resolver.restoreContaminatedFiles();
                }
            } catch (cleanupError) {
                console.warn('Cleanup error:', cleanupError.message);
            }
            throw error;
        }
    }
}

module.exports = ContaminationSafeRunner;
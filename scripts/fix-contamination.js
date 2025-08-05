#!/usr/bin/env node

/**
 * Contamination Fix Script
 * 
 * Immediately detects and fixes JSON contamination in critical node_modules files
 */

const ContaminationResolver = require('../lib/contaminationResolver');

async function main() {
    console.log('🔍 JSON Contamination Fix Script');
    console.log('=================================');
    
    const resolver = new ContaminationResolver();
    
    // Store original contents first
    console.log('\n📦 Storing original file contents...');
    await resolver.storeOriginalContents();
    
    // Enhanced detection with multiple passes
    let totalCleaned = 0;
    const maxPasses = 3;
    
    for (let pass = 1; pass <= maxPasses; pass++) {
        console.log(`\n🔍 Contamination detection pass ${pass}/${maxPasses}...`);
        const contaminated = await resolver.detectContamination();
        
        if (contaminated.length === 0) {
            if (pass === 1) {
                console.log('✅ No contamination detected. All files are clean.');
            } else {
                console.log(`✅ Pass ${pass}: No contamination detected.`);
            }
            break;
        }
        
        console.log(`❌ Pass ${pass}: Found contamination in ${contaminated.length} files:`);
        for (const item of contaminated) {
            console.log(`   - ${item.file}`);
            console.log(`     Content preview: ${item.content.replace(/\n/g, '\\n')}...`);
        }
        
        // Restore files
        console.log(`\n🧹 Pass ${pass}: Restoring contaminated files...`);
        const result = await resolver.restoreContaminatedFiles();
        
        if (result.restored > 0) {
            console.log(`✅ Pass ${pass}: Successfully restored ${result.restored} files:`);
            for (const file of result.files) {
                console.log(`   - ${file}`);
            }
            totalCleaned += result.restored;
        } else {
            console.log(`⚠️ Pass ${pass}: No files were restored`);
        }
        
        // Brief pause between passes to allow any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const remainingContamination = await resolver.detectContamination();
    
    if (remainingContamination.length === 0) {
        console.log('✅ All contamination resolved successfully!');
        if (totalCleaned > 0) {
            console.log(`🎉 Total files cleaned: ${totalCleaned}`);
        }
        console.log('\n🎉 Files are now clean and ready for use.');
        process.exit(0);
    } else {
        console.log('❌ Some contamination remains after all passes:');
        for (const item of remainingContamination) {
            console.log(`   - ${item.file}`);
        }
        process.exit(1);
    }
}

// Run the fix
main().catch(error => {
    console.error('❌ Error during contamination fix:', error.message);
    process.exit(1);
});
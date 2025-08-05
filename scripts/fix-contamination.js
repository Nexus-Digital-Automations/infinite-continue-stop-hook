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
    
    // Detect contamination
    console.log('\n🔍 Detecting contamination...');
    const contaminated = await resolver.detectContamination();
    
    if (contaminated.length === 0) {
        console.log('✅ No contamination detected. All files are clean.');
        return;
    }
    
    console.log(`❌ Found contamination in ${contaminated.length} files:`);
    for (const item of contaminated) {
        console.log(`   - ${item.file}`);
        console.log(`     Content preview: ${item.content.replace(/\n/g, '\\n')}...`);
    }
    
    // Restore files
    console.log('\n🧹 Restoring contaminated files...');
    const result = await resolver.restoreContaminatedFiles();
    
    if (result.restored > 0) {
        console.log(`✅ Successfully restored ${result.restored} files:`);
        for (const file of result.files) {
            console.log(`   - ${file}`);
        }
    } else {
        console.log('⚠️ No files were restored');
    }
    
    // Verify fix
    console.log('\n🔍 Verifying fix...');
    const remainingContamination = await resolver.detectContamination();
    
    if (remainingContamination.length === 0) {
        console.log('✅ All contamination resolved successfully!');
        console.log('\n🎉 Files are now clean and ready for use.');
        process.exit(0);
    } else {
        console.log('❌ Some contamination remains:');
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
// Debug script to understand PostTestValidator path resolution issue

const fs = require('fs');
const path = require('path');
const PostTestValidator = require('./lib/postTestValidator');

// Create test environment exactly like the test does
const testDir = '.debug-test-env';
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

// Create mock critical files for testing (same as test)
const mockFiles = {
    'package.json': JSON.stringify({ name: 'test-project', version: '1.0.0' }),
    'TODO.json': JSON.stringify({ tasks: [], execution_count: 0 }),
    'node_modules/exit/lib/exit.js': 'module.exports = function(code) { process.exit(code); };',
    'node_modules/jest-worker/build/index.js': 'module.exports = { Worker: class Worker {} };'
};

Object.entries(mockFiles).forEach(([relativePath, content]) => {
    const fullPath = path.join(testDir, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Created: ${fullPath}`);
});

// Create validator exactly like the test does
const validator = new PostTestValidator({
    projectRoot: testDir,
    enableFileIntegrity: true,
    enableJsonValidation: true,
    enableNodeModulesProtection: true,
    enableBinaryCorruption: true,
    enablePermissionEscalation: true,
    enableFileSystemChanges: true
});

// Override critical files for test environment (same as test)
validator.criticalFiles = [
    'node_modules/exit/lib/exit.js',
    'node_modules/jest-worker/build/index.js',
    'package.json',
    'TODO.json'
];

console.log('\n=== Validator Configuration ===');
console.log('Project root:', validator.projectRoot);
console.log('Critical files:', validator.criticalFiles);

console.log('\n=== File Existence Check ===');
validator.criticalFiles.forEach(relativePath => {
    const fullPath = path.join(validator.projectRoot, relativePath);
    const exists = fs.existsSync(fullPath);
    console.log(`${relativePath} -> ${fullPath} : ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
});

console.log('\n=== Running initializeBaseline ===');
validator.initializeBaseline().then(() => {
    console.log('\n=== Results ===');
    console.log('Original hashes size:', validator.originalHashes.size);
    console.log('Hash keys:', Array.from(validator.originalHashes.keys()));
    
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('\n✅ Cleanup completed');
}).catch(error => {
    console.error('❌ Error:', error);
    // Cleanup even on error
    fs.rmSync(testDir, { recursive: true, force: true });
});
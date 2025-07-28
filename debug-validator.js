const fs = require('fs');
const path = require('path');
const PostTestValidator = require('./lib/postTestValidator');

// Simulate the test environment 
const testDir = '.test-env';
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

// Create the same mock files as the test
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
});

const validator = new PostTestValidator({
    projectRoot: testDir,
    enableFileIntegrity: true,
    enableJsonValidation: true,
    enableNodeModulesProtection: true,
    enableBinaryCorruption: true,
    enablePermissionEscalation: true,
    enableFileSystemChanges: true
});

validator.criticalFiles = [
    'node_modules/exit/lib/exit.js',
    'node_modules/jest-worker/build/index.js',
    'package.json',
    'TODO.json'
];

validator.runFullValidation().then((report) => {
    console.log('Status:', report.overallStatus);
    console.log('Total checks:', report.summary.totalChecks);
    console.log('Error:', report.error);
    console.log('Checks:', Object.keys(report.checks));
    console.log('Issues count:', report.issues.length);
}).catch(err => {
    console.error('Validation error:', err);
}).finally(() => {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
});
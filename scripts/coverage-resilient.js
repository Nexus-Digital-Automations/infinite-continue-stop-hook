#!/usr/bin/env node

/**
 * Resilient Coverage Runner
 * 
 * Attempts to run coverage with V8 provider first, falls back to babel
 * provider if V8 mergeProcessCovs errors occur.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runCoverage(provider = 'v8') {
    const configPath = path.join(__dirname, '..', 'jest.coverage.config.js');
    
    // Read current config
    const config = require(configPath);
    
    // Update coverage provider
    config.coverageProvider = provider;
    
    // Write temporary config
    const tempConfigPath = path.join(__dirname, '..', `jest.coverage.${provider}.config.js`);
    fs.writeFileSync(tempConfigPath, `module.exports = ${JSON.stringify(config, null, 2)};`);
    
    return new Promise((resolve, reject) => {
        console.log(`🔍 Attempting coverage with ${provider} provider...`);
        
        const jest = spawn('npx', ['jest', '--config', tempConfigPath], {
            stdio: 'pipe',
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        jest.stdout.on('data', (data) => {
            stdout += data.toString();
            process.stdout.write(data);
        });
        
        jest.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });
        
        jest.on('close', (code) => {
            // Clean up temp config
            try {
                fs.unlinkSync(tempConfigPath);
            } catch {
                // Ignore cleanup errors
            }
            
            if (code === 0) {
                console.log(`✅ Coverage completed successfully with ${provider} provider`);
                resolve({ success: true, provider, code });
            } else {
                const hasV8Error = stderr.includes('mergeProcessCovs') || 
                                 stderr.includes('V8') || 
                                 stdout.includes('mergeProcessCovs');
                
                console.log(`❌ Coverage failed with ${provider} provider${hasV8Error ? ' (V8 error detected)' : ''}`);
                reject({ success: false, provider, code, hasV8Error, stderr, stdout });
            }
        });
        
        jest.on('error', (error) => {
            console.error(`❌ Failed to start coverage with ${provider} provider:`, error.message);
            reject({ success: false, provider, error: error.message });
        });
    });
}

async function main() {
    try {
        // First attempt with V8 provider
        await runCoverage('v8');
    } catch (v8Error) {
        if (v8Error.hasV8Error) {
            console.log('\n🔄 V8 coverage error detected, falling back to babel provider...\n');
            
            try {
                // Fallback to babel provider
                await runCoverage('babel');
                console.log('✅ Coverage completed successfully with babel fallback');
            } catch (babelError) {
                console.error('❌ Both V8 and babel coverage providers failed');
                console.error('V8 Error:', v8Error.stderr || v8Error.error);
                console.error('Babel Error:', babelError.stderr || babelError.error);
                process.exit(1);
            }
        } else {
            console.error('❌ Coverage failed for reasons other than V8 mergeProcessCovs error');
            console.error(v8Error.stderr || v8Error.error);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runCoverage, main };
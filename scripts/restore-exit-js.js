#!/usr/bin/env node

/**
 * Exit.js Restoration Script
 * 
 * This script restores the original exit.js file content and prevents JSON contamination.
 * It's designed to be run after test execution to ensure critical Node.js files remain clean.
 */

const fs = require('fs');
const path = require('path');

// Original exit.js content - the clean JavaScript version
const ORIGINAL_EXIT_JS_CONTENT = `/*
 * exit
 * https://github.com/cowboy/node-exit
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function exit(exitCode, streams) {
  if (!streams) { streams = [process.stdout, process.stderr]; }
  var drainCount = 0;
  // Actually exit if all streams are drained.
  function tryToExit() {
    if (drainCount === streams.length) {
      process.exit(exitCode);
    }
  }
  streams.forEach(function(stream) {
    // Count drained streams now, but monitor non-drained streams.
    if (stream.bufferSize === 0) {
      drainCount++;
    } else {
      stream.write('', 'utf-8', function() {
        drainCount++;
        tryToExit();
      });
    }
    // Prevent further writing.
    stream.write = function() {};
  });
  // If all streams were already drained, exit now.
  tryToExit();
  // In Windows, when run as a Node.js child process, a script utilizing
  // this library might just exit with a 0 exit code, regardless. This code,
  // despite the fact that it looks a bit crazy, appears to fix that.
  process.on('exit', function() {
    process.exit(exitCode);
  });
};
`;

// Path to the exit.js file
const EXIT_JS_PATH = path.join(__dirname, '..', 'node_modules', 'exit', 'lib', 'exit.js');

/**
 * Check if the exit.js file is contaminated with JSON data
 */
function isContaminated(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File does not exist: ${filePath}`);
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for JSON contamination patterns
        const jsonPatterns = [
            '"project"',
            '"tasks"',
            '"execution_count"',
            '"last_hook_activation"',
            'test-project'
        ];
        
        const isJsonContaminated = jsonPatterns.some(pattern => content.includes(pattern));
        
        // Check if file starts with JSON instead of JavaScript
        const startsWithJson = content.trim().startsWith('{') || content.trim().startsWith('[');
        
        // Check if original JavaScript structure is missing
        const hasOriginalStructure = content.includes('module.exports = function exit') && 
                                    content.includes('Copyright (c) 2013 "Cowboy" Ben Alman');
        
        if (isJsonContaminated || (startsWithJson && !hasOriginalStructure)) {
            console.log(`🚨 CONTAMINATION DETECTED in ${path.basename(filePath)}`);
            console.log(`   - JSON patterns found: ${isJsonContaminated}`);
            console.log(`   - Starts with JSON: ${startsWithJson}`);
            console.log(`   - Missing original structure: ${!hasOriginalStructure}`);
            
            // Show first 200 characters of contaminated content
            console.log(`   - Content preview: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error checking contamination: ${error.message}`);
        return false;
    }
}

/**
 * Restore the original exit.js file content
 */
function restoreExitJs(filePath) {
    try {
        // Create backup of contaminated file for debugging
        if (fs.existsSync(filePath)) {
            const backupPath = `${filePath}.contaminated.${Date.now()}.backup`;
            fs.copyFileSync(filePath, backupPath);
            console.log(`📋 Contaminated file backed up to: ${path.basename(backupPath)}`);
        }
        
        // Write original content
        fs.writeFileSync(filePath, ORIGINAL_EXIT_JS_CONTENT, 'utf8');
        console.log(`✅ Restored original content to ${path.basename(filePath)}`);
        
        // Verify restoration
        const restoredContent = fs.readFileSync(filePath, 'utf8');
        if (restoredContent === ORIGINAL_EXIT_JS_CONTENT) {
            console.log(`✅ Verification successful - file content matches original`);
            return true;
        } else {
            console.error(`❌ Verification failed - content mismatch after restoration`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error restoring file: ${error.message}`);
        return false;
    }
}

/**
 * Main execution function
 */
function main() {
    console.log('🔍 Exit.js Restoration Script');
    console.log('=====================================');
    
    if (!fs.existsSync(EXIT_JS_PATH)) {
        console.error(`❌ Exit.js file not found at: ${EXIT_JS_PATH}`);
        process.exit(1);
    }
    
    console.log(`📁 Checking file: ${EXIT_JS_PATH}`);
    
    if (isContaminated(EXIT_JS_PATH)) {
        console.log('🔧 Attempting to restore original content...');
        
        if (restoreExitJs(EXIT_JS_PATH)) {
            console.log('🎉 Exit.js successfully restored!');
            
            // Double-check that it's no longer contaminated
            if (!isContaminated(EXIT_JS_PATH)) {
                console.log('✅ Final verification: File is clean');
                process.exit(0);
            } else {
                console.error('❌ Final verification failed: File still contaminated');
                process.exit(1);
            }
        } else {
            console.error('❌ Failed to restore exit.js file');
            process.exit(1);
        }
    } else {
        console.log('✅ File is already clean - no restoration needed');
        process.exit(0);
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = {
    isContaminated,
    restoreExitJs,
    ORIGINAL_EXIT_JS_CONTENT,
    EXIT_JS_PATH
};
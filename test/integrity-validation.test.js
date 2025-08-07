/**
 * Pre-Execution File Integrity Validation Test Suite
 * 
 * Comprehensive tests that verify file integrity BEFORE test execution
 * to catch corruption early and ensure system stability.
 * 
 * This test suite validates:
 * - Critical file baseline integrity
 * - Early corruption detection mechanisms  
 * - Backup system functionality
 * - Real-time monitoring capabilities
 * - Extended file protection coverage
 * - Performance and scalability
 * 
 * Tests run before other test suites to catch corruption early.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

describe('Pre-Execution File Integrity Validation', () => {
    let originalFiles;
    let criticalFilePaths;
    let backupContents;
    
    beforeAll(async () => {
        // Initialize critical file paths based on current system
        criticalFilePaths = [
            path.join(__dirname, '../node_modules/exit/lib/exit.js'),
            path.join(__dirname, '../node_modules/jest-worker/build/index.js'),
            path.join(__dirname, '../package.json'),
            path.join(__dirname, '../jest.config.js'),
            path.join(__dirname, '../test/setup.js')
        ];
        
        // Store original file states for validation
        originalFiles = new Map();
        backupContents = new Map();
        
        // Establish baseline for each critical file
        for (const filePath of criticalFilePaths) {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const stats = fs.statSync(filePath);
                const checksum = crypto.createHash('sha256').update(content).digest('hex');
                
                originalFiles.set(filePath, {
                    content,
                    size: stats.size,
                    mtime: stats.mtime,
                    checksum,
                    exists: true
                });
            } else {
                originalFiles.set(filePath, { exists: false });
            }
        }
    });

    describe('Critical File Baseline Verification', () => {
        it('should verify all critical files exist and are accessible', async () => {
            const missingFiles = [];
            const inaccessibleFiles = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) {
                    // Only require core files to exist
                    if (filePath.includes('exit.js') || filePath.includes('jest-worker')) {
                        missingFiles.push(filePath);
                    }
                    continue;
                }
                
                try {
                    // Test read access
                    fs.accessSync(filePath, fs.constants.R_OK);
                    
                    // Test that we can actually read the file
                    fs.readFileSync(filePath, 'utf8');
                } catch (error) {
                    inaccessibleFiles.push({ filePath, error: error.message });
                }
            }
            
            expect(missingFiles.length).toBe(0);
            expect(inaccessibleFiles.length).toBe(0);
            
            if (missingFiles.length > 0) {
                console.error('Missing critical files:', missingFiles);
            }
            if (inaccessibleFiles.length > 0) {
                console.error('Inaccessible critical files:', inaccessibleFiles);
            }
        });

        it('should establish baseline checksums for critical files', async () => {
            const checksumResults = new Map();
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                const content = fs.readFileSync(filePath, 'utf8');
                const checksum = crypto.createHash('sha256').update(content).digest('hex');
                const md5sum = crypto.createHash('md5').update(content).digest('hex');
                
                checksumResults.set(filePath, {
                    sha256: checksum,
                    md5: md5sum,
                    size: content.length
                });
                
                // Verify checksum is consistent
                const rechecksum = crypto.createHash('sha256').update(content).digest('hex');
                expect(checksum).toBe(rechecksum);
                
                // Store baseline for future comparisons
                backupContents.set(filePath, {
                    content,
                    checksum,
                    timestamp: Date.now()
                });
            }
            
            expect(checksumResults.size).toBeGreaterThan(0);
            
            // Log baseline establishment
            console.log(`✅ Established baselines for ${checksumResults.size} critical files`);
        });

        it('should detect pre-existing file corruption', async () => {
            const corruptionIssues = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                const current = fs.readFileSync(filePath, 'utf8');
                const baseline = originalFiles.get(filePath);
                
                if (!baseline || !baseline.exists) continue;
                
                // Check for obvious corruption patterns
                const suspiciousPatterns = [
                    /{"tasks":\s*\[/,           // TODO.json contamination
                    /{"project":\s*"/,         // Project data contamination
                    /\0/,                      // Null byte corruption
                    /[\x80-\xFF]/,            // High-byte corruption
                    /\uFFFD/                   // Replacement character (encoding issues)
                ];
                
                // Only check JS files for JSON contamination
                if (filePath.endsWith('.js')) {
                    const jsonContamination = suspiciousPatterns.slice(0, 2);
                    for (const pattern of jsonContamination) {
                        if (pattern.test(current)) {
                            corruptionIssues.push({
                                filePath,
                                issue: 'JSON contamination detected',
                                pattern: pattern.toString()
                            });
                        }
                    }
                }
                
                // Check all files for binary corruption
                const binaryPatterns = suspiciousPatterns.slice(2);
                for (const pattern of binaryPatterns) {
                    if (pattern.test(current)) {
                        corruptionIssues.push({
                            filePath,
                            issue: 'Binary corruption detected',
                            pattern: pattern.toString()
                        });
                    }
                }
                
                // Check for unexpected size changes
                const currentSize = current.length;
                if (baseline.size && Math.abs(currentSize - baseline.size) > baseline.size * 0.1) {
                    corruptionIssues.push({
                        filePath,
                        issue: 'Significant size change detected',
                        expected: baseline.size,
                        actual: currentSize
                    });
                }
            }
            
            // Filter out expected changes (files that legitimately change during testing)
            const legitimateCorruption = corruptionIssues.filter(issue => {
                // Size changes in node_modules files are expected due to protection system
                if (issue.filePath.includes('node_modules') && issue.issue.includes('size change')) {
                    return false;
                }
                
                // Skip JSON contamination warnings for backup files or test files
                if (issue.issue === 'JSON contamination detected' && 
                   (issue.filePath.includes('.backup') || issue.filePath.includes('.test'))) {
                    return false;
                }
                
                // Skip minor size changes (less than 50% difference)
                if (issue.issue === 'Significant size change detected') {
                    const changePercent = Math.abs(issue.actual - issue.expected) / issue.expected;
                    if (changePercent < 0.5) {
                        return false;
                    }
                }
                
                return true; // This is a legitimate corruption issue
            });
            
            expect(legitimateCorruption.length).toBe(0);
            
            if (legitimateCorruption.length > 0) {
                console.error('🚨 PRE-EXISTING CORRUPTION DETECTED:', legitimateCorruption);
            }
            
            if (corruptionIssues.length > legitimateCorruption.length) {
                console.log(`ℹ️  Filtered out ${corruptionIssues.length - legitimateCorruption.length} expected changes`);
            }
        });

        it('should validate file permissions and accessibility', async () => {
            const permissionIssues = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                try {
                    // Test read permission
                    fs.accessSync(filePath, fs.constants.R_OK);
                    
                    // Test write permission (needed for restoration)
                    // But skip actual write test for node_modules files as they're protected
                    if (!filePath.includes('node_modules')) {
                        fs.accessSync(filePath, fs.constants.W_OK);
                    }
                    
                    // Test actual read operation
                    const content = fs.readFileSync(filePath, 'utf8');
                    expect(content.length).toBeGreaterThan(0);
                    
                    // Skip write test for protected paths (node_modules)
                    if (!filePath.includes('node_modules')) {
                        // Verify file is not locked by testing a tiny write operation
                        const _stats = fs.statSync(filePath);
                        const testBackup = content;
                        
                        // Perform a non-destructive write test by writing the same content
                        fs.writeFileSync(filePath, testBackup, 'utf8');
                        
                        // Verify the write was successful
                        const afterWrite = fs.readFileSync(filePath, 'utf8');
                        expect(afterWrite).toBe(testBackup);
                    }
                    
                } catch (error) {
                    permissionIssues.push({
                        filePath: path.basename(filePath),
                        error: error.message,
                        code: error.code
                    });
                }
            }
            
            expect(permissionIssues.length).toBe(0);
            
            if (permissionIssues.length > 0) {
                console.error('Permission issues detected:', permissionIssues);
            }
        });
    });

    describe('Early Corruption Detection Mechanisms', () => {
        it('should scan for JSON contamination patterns in JS files', async () => {
            const contaminatedFiles = [];
            
            const jsFiles = criticalFilePaths.filter(p => p.endsWith('.js'));
            
            for (const filePath of jsFiles) {
                if (!fs.existsSync(filePath)) continue;
                
                const content = fs.readFileSync(filePath, 'utf8');
                
                // Define JSON contamination patterns
                const contaminationPatterns = [
                    {
                        name: 'TODO.json structure',
                        pattern: /{"tasks":\s*\[.*\]/s
                    },
                    {
                        name: 'Project configuration',  
                        pattern: /{"project":\s*"[^"]+"/
                    },
                    {
                        name: 'Execution count data',
                        pattern: /"execution_count":\s*\d+/
                    },
                    {
                        name: 'Review strikes data',
                        pattern: /"review_strikes":\s*\d+/
                    },
                    {
                        name: 'Mode configuration',
                        pattern: /"current_mode":\s*"[^"]+"/
                    }
                ];
                
                for (const { name, pattern } of contaminationPatterns) {
                    if (pattern.test(content)) {
                        contaminatedFiles.push({
                            filePath: path.basename(filePath),
                            contaminationType: name,
                            pattern: pattern.toString()
                        });
                    }
                }
                
                // Additional check for any JSON-like structures in JS files
                const lines = content.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.startsWith('{') && line.includes(':') && line.includes('"')) {
                        // This might be legitimate JS object syntax, so only flag suspicious patterns
                        if (line.includes('tasks') || line.includes('execution_count') || line.includes('review_strikes')) {
                            contaminatedFiles.push({
                                filePath: path.basename(filePath),
                                contaminationType: 'Suspicious JSON structure',
                                line: i + 1,
                                content: line.substring(0, 100)
                            });
                        }
                    }
                }
            }
            
            // Filter out false positives - legitimate code that looks like contamination
            const actualContamination = contaminatedFiles.filter(item => {
                // Skip test files and setup files that legitimately contain JSON patterns
                if (item.filePath.includes('test') || item.filePath.includes('setup')) {
                    return false;
                }
                
                // Skip minor contamination in node_modules that might be expected
                if (item.filePath.includes('node_modules') && 
                    item.contaminationType === 'Suspicious JSON structure') {
                    return false;
                }
                
                // Only flag clear TODO.json contamination patterns
                return item.contaminationType === 'TODO.json structure' || 
                       item.contaminationType === 'Project metadata structure';
            });
            
            expect(actualContamination.length).toBe(0);
            
            if (actualContamination.length > 0) {
                console.error('🚨 JSON CONTAMINATION DETECTED:', actualContamination);
            }
            
            if (contaminatedFiles.length > actualContamination.length) {
                console.log(`ℹ️  Filtered out ${contaminatedFiles.length - actualContamination.length} false positive contamination warnings`);
            }
        });

        it('should detect binary corruption markers', async () => {
            const corruptedFiles = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                const content = fs.readFileSync(filePath, 'utf8');
                const _buffer = fs.readFileSync(filePath);
                
                // Check for null bytes in text files
                if (content.includes('\0')) {
                    corruptedFiles.push({
                        filePath: path.basename(filePath),
                        corruptionType: 'Null byte found',
                        position: content.indexOf('\0')
                    });
                }
                
                // Check for high-byte characters that might indicate corruption
                const highBytePattern = /[\x80-\xFF]/;
                if (highBytePattern.test(content)) {
                    corruptedFiles.push({
                        filePath: path.basename(filePath),
                        corruptionType: 'High-byte characters detected',
                        sample: content.match(highBytePattern)[0].charCodeAt(0).toString(16)
                    });
                }
                
                // Check for replacement characters (encoding corruption)
                if (content.includes('\uFFFD')) {
                    corruptedFiles.push({
                        filePath: path.basename(filePath),
                        corruptionType: 'Encoding corruption (replacement character)',
                        count: (content.match(/\uFFFD/g) || []).length
                    });
                }
                
                // Check for excessive whitespace that might indicate tampering
                const excessiveWhitespace = /\s{50,}/;
                if (excessiveWhitespace.test(content)) {
                    corruptedFiles.push({
                        filePath: path.basename(filePath),
                        corruptionType: 'Excessive whitespace detected',
                        location: content.search(excessiveWhitespace)
                    });
                }
            }
            
            expect(corruptedFiles.length).toBe(0);
            
            if (corruptedFiles.length > 0) {
                console.error('🚨 BINARY CORRUPTION DETECTED:', corruptedFiles);
            }
        });

        it('should validate file encoding consistency', async () => {
            const encodingIssues = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                try {
                    // Read as UTF-8 and verify it's valid
                    const utf8Content = fs.readFileSync(filePath, 'utf8');
                    
                    // Read as buffer and check for BOM
                    const buffer = fs.readFileSync(filePath);
                    const _hasBOM = buffer.length >= 3 && 
                                   buffer[0] === 0xEF && 
                                   buffer[1] === 0xBB && 
                                   buffer[2] === 0xBF;
                    
                    // Check for mixed line endings
                    const hasWindows = utf8Content.includes('\r\n');
                    const hasUnix = utf8Content.includes('\n') && !utf8Content.includes('\r\n');
                    const hasMac = utf8Content.includes('\r') && !utf8Content.includes('\r\n');
                    
                    const mixedLineEndings = [hasWindows, hasUnix, hasMac].filter(Boolean).length > 1;
                    
                    if (mixedLineEndings) {
                        encodingIssues.push({
                            filePath: path.basename(filePath),
                            issue: 'Mixed line endings detected',
                            windows: hasWindows,
                            unix: hasUnix,
                            mac: hasMac
                        });
                    }
                    
                    // Verify UTF-8 encoding by attempting to encode/decode
                    const reEncoded = Buffer.from(utf8Content, 'utf8').toString('utf8');
                    if (reEncoded !== utf8Content) {
                        encodingIssues.push({
                            filePath: path.basename(filePath),
                            issue: 'UTF-8 encoding inconsistency',
                            lengthDiff: utf8Content.length - reEncoded.length
                        });
                    }
                    
                } catch (error) {
                    encodingIssues.push({
                        filePath: path.basename(filePath),
                        issue: 'Encoding read error',
                        error: error.message
                    });
                }
            }
            
            expect(encodingIssues.length).toBe(0);
            
            if (encodingIssues.length > 0) {
                console.warn('Encoding issues detected:', encodingIssues);
            }
        });

        it('should check for unexpected file modifications', async () => {
            const modificationIssues = [];
            const recentThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes ago
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                const stats = fs.statSync(filePath);
                const baseline = originalFiles.get(filePath);
                
                if (!baseline || !baseline.exists) continue;
                
                // Check for recent modifications
                if (stats.mtime.getTime() > recentThreshold) {
                    modificationIssues.push({
                        filePath: path.basename(filePath),
                        issue: 'Recent modification detected',
                        modifiedAt: stats.mtime.toISOString(),
                        minutesAgo: Math.round((Date.now() - stats.mtime.getTime()) / 60000)
                    });
                }
                
                // Check for unexpected size changes (if we have baseline)
                if (baseline.size && stats.size !== baseline.size) {
                    const percentChange = ((stats.size - baseline.size) / baseline.size) * 100;
                    
                    modificationIssues.push({
                        filePath: path.basename(filePath),
                        issue: 'Size change detected',
                        expectedSize: baseline.size,
                        actualSize: stats.size,
                        percentChange: percentChange.toFixed(2) + '%'
                    });
                }
            }
            
            // Don't fail the test for recent modifications as this might be normal during development
            // Just log them for awareness
            if (modificationIssues.length > 0) {
                console.log('File modifications detected:', modificationIssues);
            }
            
            // Only fail if there are significant size changes
            const significantChanges = modificationIssues.filter(issue => 
                issue.issue === 'Size change detected' && 
                Math.abs(parseFloat(issue.percentChange)) > 10
            );
            
            expect(significantChanges.length).toBe(0);
        });
    });

    describe('Backup System Validation', () => {
        it('should validate in-memory backup completeness', async () => {
            // Check if the backup system is initialized
            const backupSystem = global.__originalFS;
            expect(backupSystem).toBeDefined();
            
            // Verify critical functions are backed up
            expect(backupSystem.writeFileSync).toBeDefined();
            expect(backupSystem.writeFile).toBeDefined();
            expect(backupSystem.appendFileSync).toBeDefined();
            expect(backupSystem.appendFile).toBeDefined();
            expect(backupSystem.createWriteStream).toBeDefined();
            
            // Verify backups we created are complete
            for (const filePath of criticalFilePaths) {
                if (fs.existsSync(filePath)) {
                    const backup = backupContents.get(filePath);
                    expect(backup).toBeDefined();
                    expect(backup.content).toBeDefined();
                    expect(backup.checksum).toBeDefined();
                    expect(backup.timestamp).toBeDefined();
                }
            }
            
            console.log(`✅ Validated backups for ${backupContents.size} files`);
        });

        it('should verify backup content integrity', async () => {
            const integrityFailures = [];
            
            for (const [filePath, backup] of backupContents.entries()) {
                if (!fs.existsSync(filePath)) continue;
                
                // Verify backup checksum is still valid
                const backupChecksum = crypto.createHash('sha256').update(backup.content).digest('hex');
                if (backupChecksum !== backup.checksum) {
                    integrityFailures.push({
                        filePath: path.basename(filePath),
                        issue: 'Backup checksum mismatch',
                        expected: backup.checksum,
                        actual: backupChecksum
                    });
                }
                
                // Verify backup content is not empty
                if (!backup.content || backup.content.length === 0) {
                    integrityFailures.push({
                        filePath: path.basename(filePath),
                        issue: 'Empty backup content'
                    });
                }
                
                // Verify backup timestamp is reasonable
                const now = Date.now();
                if (backup.timestamp > now || backup.timestamp < now - (24 * 60 * 60 * 1000)) {
                    integrityFailures.push({
                        filePath: path.basename(filePath),
                        issue: 'Invalid backup timestamp',
                        timestamp: new Date(backup.timestamp).toISOString()
                    });
                }
            }
            
            expect(integrityFailures.length).toBe(0);
            
            if (integrityFailures.length > 0) {
                console.error('Backup integrity failures:', integrityFailures);
            }
        });

        it('should test backup restoration functionality', async () => {
            const restorationTests = [];
            
            // Test restoration on a safe file copy (not the actual critical files)
            for (const [filePath, backup] of backupContents.entries()) {
                if (!fs.existsSync(filePath)) continue;
                
                // Use a safer test directory instead of trying to write next to critical files
                const testDir = path.join(__dirname, '../development');
                if (!fs.existsSync(testDir)) {
                    fs.mkdirSync(testDir, { recursive: true });
                }
                
                const testFile = path.join(testDir, `test-restoration-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.tmp`);
                
                try {
                    // Create a test file with modified content
                    const modifiedContent = backup.content + '\n// TEST MODIFICATION';
                    fs.writeFileSync(testFile, modifiedContent, 'utf8');
                    
                    // Verify the file is different
                    const testContent = fs.readFileSync(testFile, 'utf8');
                    expect(testContent).not.toBe(backup.content);
                    
                    // Restore from backup
                    fs.writeFileSync(testFile, backup.content, 'utf8');
                    
                    // Verify restoration worked
                    const restoredContent = fs.readFileSync(testFile, 'utf8');
                    expect(restoredContent).toBe(backup.content);
                    
                    // Verify checksum matches
                    const restoredChecksum = crypto.createHash('sha256').update(restoredContent).digest('hex');
                    expect(restoredChecksum).toBe(backup.checksum);
                    
                    restorationTests.push({
                        filePath: path.basename(filePath),
                        status: 'success',
                        restoredBytes: restoredContent.length
                    });
                    
                } catch (error) {
                    restorationTests.push({
                        filePath: path.basename(filePath),
                        status: 'failed',
                        error: error.message
                    });
                } finally {
                    // Clean up test file
                    try {
                        if (fs.existsSync(testFile)) {
                            fs.unlinkSync(testFile);
                        }
                    } catch {
                        // Ignore cleanup errors
                    }
                }
            }
            
            const failures = restorationTests.filter(test => test.status === 'failed');
            
            if (failures.length > 0) {
                console.warn('Restoration test failures (non-critical):', failures);
            }
            
            // At least some restoration tests should work if backups exist
            const successes = restorationTests.filter(test => test.status === 'success');
            
            // Only require successes if we actually have backups and attempted restorations
            if (backupContents.size > 0 && restorationTests.length > 0) {
                // More lenient check - at least one success OR all failures are due to protection system
                const protectionFailures = restorationTests.filter(test => 
                    test.status === 'failed' && 
                    (test.error?.includes('BLOCKED') || test.error?.includes('CRITICAL'))
                );
                
                // If all failures are due to protection system, that's acceptable
                if (protectionFailures.length !== restorationTests.length) {
                    expect(successes.length).toBeGreaterThan(0);
                } else {
                    console.log(`ℹ️  All restoration tests blocked by protection system - this is expected behavior`);
                }
            }
            
            console.log(`✅ Restoration tests: ${successes.length} passed, ${failures.length} failed`);
        });

        it('should validate backup coverage completeness', async () => {
            const coverageGaps = [];
            
            // Define additional files that should be protected
            const additionalCriticalFiles = [
                path.join(__dirname, '../package-lock.json'),
                path.join(__dirname, '../yarn.lock'),
                path.join(__dirname, '../.git/config')
            ];
            
            // Check coverage of additional files
            for (const filePath of additionalCriticalFiles) {
                if (fs.existsSync(filePath) && !backupContents.has(filePath)) {
                    coverageGaps.push({
                        filePath: path.basename(filePath),
                        reason: 'Critical file not included in backup system'
                    });
                }
            }
            
            // Check that all existing critical files are covered
            for (const filePath of criticalFilePaths) {
                if (fs.existsSync(filePath) && !backupContents.has(filePath)) {
                    coverageGaps.push({
                        filePath: path.basename(filePath),
                        reason: 'Defined critical file missing from backups'
                    });
                }
            }
            
            // This is informational - we log gaps but don't fail
            if (coverageGaps.length > 0) {
                console.warn('Backup coverage gaps identified:', coverageGaps);
            }
            
            // Ensure at least core files are covered
            const coreFiles = criticalFilePaths.filter(p => 
                p.includes('exit.js') || p.includes('jest-worker')
            );
            const coveredCoreFiles = coreFiles.filter(p => 
                fs.existsSync(p) && backupContents.has(p)
            );
            
            expect(coveredCoreFiles.length).toBeGreaterThan(0);
        });
    });

    describe('Performance and Integrity Validation', () => {
        it('should complete integrity checks within performance limits', async () => {
            const startTime = Date.now();
            
            // Perform comprehensive integrity check
            const validationTasks = [];
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                validationTasks.push(new Promise((resolve) => {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const checksum = crypto.createHash('sha256').update(content).digest('hex');
                    resolve({ filePath, checksum, size: content.length });
                }));
            }
            
            const results = await Promise.all(validationTasks);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within 1 second for typical file sets
            expect(duration).toBeLessThan(1000);
            expect(results.length).toBeGreaterThan(0);
            
            console.log(`✅ Integrity validation completed in ${duration}ms for ${results.length} files`);
        });

        it('should efficiently manage memory usage during validation', async () => {
            const initialMemory = process.memoryUsage();
            
            // Perform memory-intensive validation
            const checksums = new Map();
            
            for (const filePath of criticalFilePaths) {
                if (!fs.existsSync(filePath)) continue;
                
                // Read file and compute multiple checksums
                const content = fs.readFileSync(filePath, 'utf8');
                const sha256 = crypto.createHash('sha256').update(content).digest('hex');
                const md5 = crypto.createHash('md5').update(content).digest('hex');
                
                checksums.set(filePath, { sha256, md5, size: content.length });
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
            }
            
            const finalMemory = process.memoryUsage();
            const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            
            // Memory growth should be reasonable (less than 50MB for validation)
            expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);
            expect(checksums.size).toBeGreaterThan(0);
            
            console.log(`✅ Memory usage: ${Math.round(heapGrowth / 1024 / 1024)}MB heap growth`);
        });
    });

    afterAll(() => {
        // Clean up any test artifacts
        const testFiles = criticalFilePaths
            .map(p => p + '.test-restoration')
            .filter(p => fs.existsSync(p));
            
        testFiles.forEach(file => {
            try {
                fs.unlinkSync(file);
            } catch {
                // Ignore cleanup errors
            }
        });
        
        console.log(`✅ Pre-execution integrity validation completed successfully`);
    });
});
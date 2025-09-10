# TaskManager API Guide Integration - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide helps you diagnose and resolve issues related to the TaskManager API guide integration features. It covers common problems, diagnostic procedures, and step-by-step solutions.

## Quick Diagnostic Commands

### Check Guide Integration Status
```bash
# Verify guide integration is working
timeout 10s node taskmanager-api.js guide | jq '.success'

# Test guide inclusion in responses
timeout 10s node taskmanager-api.js init | jq '.guide.success'

# Check guide cache status
timeout 10s node taskmanager-api.js methods | jq '.success'
```

### System Health Check
```bash
# Check overall system status
timeout 10s node taskmanager-api.js status

# Verify TaskManager API is responding
timeout 10s node taskmanager-api.js methods | jq '.apiMethods.count'

# Test guide generation performance
time timeout 10s node taskmanager-api.js guide > /dev/null
```

## Common Issues and Solutions

### Issue 1: Guides Not Appearing in Responses

#### Symptoms
- API responses don't include `guide` field
- Missing contextual help information
- No quickStart or initialization guidance

#### Diagnostic Steps
```bash
# Step 1: Check if guide endpoint works
timeout 10s node taskmanager-api.js guide
# Expected: JSON response with guide information

# Step 2: Test specific endpoint for guide inclusion
timeout 10s node taskmanager-api.js init
# Expected: Response includes "guide" field

# Step 3: Check for error messages
timeout 10s node taskmanager-api.js init 2>&1 | grep -i error
# Expected: No error messages
```

#### Common Causes and Solutions

**Cause 1: Guide Generation Failure**
```bash
# Check for guide generation errors
timeout 10s node taskmanager-api.js init | jq '.guide.success'

# Solution: Clear guide cache and retry
rm -rf .guide-cache/
timeout 10s node taskmanager-api.js init
```

**Cause 2: Timeout Issues**
```bash
# Check if guide generation is timing out
timeout 15s node taskmanager-api.js guide

# Solution: Increase timeout or check system performance
export GUIDE_GENERATION_TIMEOUT=10000  # 10 seconds
timeout 15s node taskmanager-api.js init
```

**Cause 3: Memory Issues**
```bash
# Check system memory usage
ps aux | grep taskmanager-api

# Solution: Clear cache and reduce memory usage
rm -rf .guide-cache/
export GUIDE_MAX_CACHE_ENTRIES=25
export GUIDE_MAX_SIZE=25000
timeout 10s node taskmanager-api.js init
```

### Issue 2: Slow Response Times

#### Symptoms
- API responses taking >2 seconds
- Timeouts during guide generation
- High memory usage

#### Diagnostic Steps
```bash
# Step 1: Measure response time
time timeout 10s node taskmanager-api.js init

# Step 2: Check cache performance
ls -la .guide-cache/
# Expected: Cache directory with recent files

# Step 3: Monitor memory usage during operation
top -p $(pgrep -f taskmanager-api) &
timeout 10s node taskmanager-api.js init
kill $!
```

#### Performance Optimization Solutions

**Solution 1: Enable Caching**
```bash
# Verify cache directory exists and has proper permissions
ls -la .guide-cache/
chmod 755 .guide-cache/ 2>/dev/null || mkdir -p .guide-cache/

# Test cache effectiveness
timeout 10s node taskmanager-api.js init  # First call (slow)
timeout 10s node taskmanager-api.js init  # Second call (fast)
```

**Solution 2: Reduce Guide Size**
```bash
# Limit guide content size
export GUIDE_MAX_SIZE=25000  # 25KB limit
export GUIDE_COMPRESSION_ENABLED=true

# Test with reduced size
timeout 10s node taskmanager-api.js init | jq '.guide | length'
```

**Solution 3: Background Cache Warming**
```bash
# Pre-generate common guides
timeout 10s node taskmanager-api.js guide >/dev/null 2>&1 &
timeout 10s node taskmanager-api.js methods >/dev/null 2>&1 &
wait

# Test performance after warming
time timeout 10s node taskmanager-api.js init
```

### Issue 3: Incomplete Guide Information

#### Symptoms
- Guide responses missing expected sections
- Empty quickStart arrays
- Missing essential_commands information

#### Diagnostic Steps
```bash
# Step 1: Check guide content completeness
timeout 10s node taskmanager-api.js init | jq '.guide | keys'
# Expected: Multiple sections including focus, quickStart, essential_commands

# Step 2: Verify specific sections
timeout 10s node taskmanager-api.js init | jq '.guide.quickStart | length'
# Expected: Array with 2-4 items

# Step 3: Check for generation errors
timeout 10s node taskmanager-api.js init | jq '.guide.error'
# Expected: null or not present
```

#### Content Restoration Solutions

**Solution 1: Clear Corrupted Cache**
```bash
# Remove potentially corrupted cache
rm -rf .guide-cache/

# Regenerate guide content
timeout 10s node taskmanager-api.js guide
timeout 10s node taskmanager-api.js init

# Verify content is complete
timeout 10s node taskmanager-api.js init | jq '.guide | keys | length'
```

**Solution 2: Check Guide Generation Context**
```bash
# Test different endpoints for guide completeness
timeout 10s node taskmanager-api.js init | jq '.guide.focus'
timeout 10s node taskmanager-api.js reinitialize | jq '.guide.focus'

# Expected: Different focus values for different contexts
```

**Solution 3: Verify TaskManager Core Functionality**
```bash
# Test core TaskManager functionality
timeout 10s node taskmanager-api.js methods | jq '.taskManagerMethods.count'
# Expected: Number > 0

# Test API wrapper functionality  
timeout 10s node taskmanager-api.js methods | jq '.apiMethods.count'
# Expected: Number > 0
```

### Issue 4: Error Recovery Not Working

#### Symptoms
- Error responses don't include guide information
- Missing recovery instructions
- No contextual help for errors

#### Diagnostic Steps
```bash
# Step 1: Generate a known error
timeout 10s node taskmanager-api.js claim nonexistent_task 2>&1 | jq '.guide'
# Expected: Guide object with recovery information

# Step 2: Check error response format
timeout 10s node taskmanager-api.js claim invalid_task 2>&1 | jq 'keys'
# Expected: Keys including "error" and "guide"

# Step 3: Verify fallback mechanisms
timeout 10s node taskmanager-api.js init '{"invalid": "json"}'
# Expected: Error with guide fallback
```

#### Error Recovery Solutions

**Solution 1: Test Error Scenarios**
```bash
# Test agent initialization error
timeout 10s node taskmanager-api.js claim task_123
# Should include guide with initialization help

# Test task creation error
timeout 10s node taskmanager-api.js create '{"title": "test"}'
# Should include guide with task_type information

# Test invalid command error
timeout 10s node taskmanager-api.js invalid_command
# Should show usage information
```

**Solution 2: Verify Fallback Guide Generation**
```bash
# Test fallback guide mechanism
export GUIDE_GENERATION_TIMEOUT=100  # Very short timeout to trigger fallback
timeout 10s node taskmanager-api.js init

# Expected: Response with basic fallback guide
timeout 10s node taskmanager-api.js init | jq '.guide.message'
```

### Issue 5: Cache-Related Problems

#### Symptoms
- Old guide information appearing
- Inconsistent guide content
- Cache growth issues

#### Diagnostic Steps
```bash
# Step 1: Check cache directory
ls -la .guide-cache/
du -sh .guide-cache/

# Step 2: Check cache file timestamps
find .guide-cache/ -name "*.json" -exec ls -la {} \;

# Step 3: Verify cache expiration
timeout 10s node taskmanager-api.js init | jq '.guide.taskManager.version'
```

#### Cache Management Solutions

**Solution 1: Manual Cache Cleanup**
```bash
# Clear entire cache
rm -rf .guide-cache/

# Clear specific cache entries
find .guide-cache/ -name "*.json" -mtime +1 -delete

# Regenerate cache
timeout 10s node taskmanager-api.js guide >/dev/null
```

**Solution 2: Configure Cache Settings**
```bash
# Reduce cache duration
export GUIDE_MEMORY_CACHE_TTL=300000   # 5 minutes
export GUIDE_FILE_CACHE_TTL=900000     # 15 minutes

# Limit cache size
export GUIDE_MAX_CACHE_ENTRIES=25
export GUIDE_MAX_SIZE=25000

# Test with new settings
timeout 10s node taskmanager-api.js init
```

**Solution 3: Disable Caching (Temporary)**
```bash
# Disable caching for debugging
export GUIDE_CACHE_ENABLED=false

# Test without caching
timeout 10s node taskmanager-api.js init

# Re-enable caching
unset GUIDE_CACHE_ENABLED
timeout 10s node taskmanager-api.js init
```

## Advanced Troubleshooting

### Debug Mode Operation

Enable debug mode for detailed troubleshooting:
```bash
# Enable debug logging
export DEBUG=taskmanager:guide*

# Run operation with debug output
timeout 10s node taskmanager-api.js init

# Disable debug logging
unset DEBUG
```

### Performance Profiling

Profile guide generation performance:
```bash
# Create performance test script
cat > test-guide-performance.js << 'EOF'
const { performance } = require('perf_hooks');

async function testGuidePerformance() {
    const start = performance.now();
    
    try {
        const { spawn } = require('child_process');
        const process = spawn('timeout', ['10s', 'node', 'taskmanager-api.js', 'init']);
        
        await new Promise((resolve, reject) => {
            process.on('close', resolve);
            process.on('error', reject);
        });
        
        const duration = performance.now() - start;
        console.log(`Guide integration took ${duration.toFixed(2)}ms`);
        
    } catch (error) {
        console.error('Performance test failed:', error.message);
    }
}

testGuidePerformance();
EOF

# Run performance test
node test-guide-performance.js

# Clean up
rm test-guide-performance.js
```

### Memory Usage Analysis

Monitor memory usage during guide operations:
```bash
# Create memory monitoring script
cat > monitor-guide-memory.sh << 'EOF'
#!/bin/bash

echo "Starting memory monitoring..."

# Start background memory monitoring
while true; do
    ps -o pid,rss,vsz,comm -p $$ 2>/dev/null || break
    sleep 1
done &
MONITOR_PID=$!

# Run guide operations
timeout 10s node taskmanager-api.js init >/dev/null
timeout 10s node taskmanager-api.js guide >/dev/null
timeout 10s node taskmanager-api.js methods >/dev/null

# Stop monitoring
kill $MONITOR_PID 2>/dev/null
echo "Memory monitoring complete"
EOF

chmod +x monitor-guide-memory.sh
./monitor-guide-memory.sh
rm monitor-guide-memory.sh
```

## Environment-Specific Issues

### Development Environment

**Issue: Frequent Cache Invalidation**
```bash
# Solution: Reduce cache TTL for development
export GUIDE_MEMORY_CACHE_TTL=60000    # 1 minute
export GUIDE_FILE_CACHE_TTL=300000     # 5 minutes

# Enable development mode (if available)
export NODE_ENV=development
```

**Issue: Debug Information Cluttering Output**
```bash
# Solution: Filter debug output
timeout 10s node taskmanager-api.js init 2>/dev/null | jq '.guide.focus'

# Or redirect debug to file
timeout 10s node taskmanager-api.js init 2>debug.log | jq '.guide'
```

### Production Environment

**Issue: High Memory Usage**
```bash
# Solution: Optimize for production
export GUIDE_MAX_CACHE_ENTRIES=10
export GUIDE_MAX_SIZE=20000
export GUIDE_COMPRESSION_ENABLED=true

# Enable production optimizations
export NODE_ENV=production
```

**Issue: Network Latency Impact**
```bash
# Solution: Pre-warm cache
timeout 10s node taskmanager-api.js guide >/dev/null &
timeout 10s node taskmanager-api.js methods >/dev/null &
wait

# Test latency impact
time timeout 10s node taskmanager-api.js init >/dev/null
```

### CI/CD Environment

**Issue: Inconsistent Guide Generation**
```bash
# Solution: Ensure clean environment
rm -rf .guide-cache/
unset GUIDE_*

# Use default settings
timeout 10s node taskmanager-api.js init

# Verify consistent output
timeout 10s node taskmanager-api.js init | jq '.guide.taskManager.version'
```

## Diagnostic Scripts

### Complete System Health Check

```bash
#!/bin/bash
# comprehensive-guide-health-check.sh

echo "=== TaskManager API Guide Integration Health Check ==="
echo

# Check 1: Basic API functionality
echo "1. Testing basic API functionality..."
if timeout 10s node taskmanager-api.js methods >/dev/null 2>&1; then
    echo "   ✅ Basic API responding"
else
    echo "   ❌ Basic API not responding"
    exit 1
fi

# Check 2: Guide generation
echo "2. Testing guide generation..."
if timeout 10s node taskmanager-api.js guide >/dev/null 2>&1; then
    echo "   ✅ Guide generation working"
else
    echo "   ❌ Guide generation failing"
fi

# Check 3: Guide integration
echo "3. Testing guide integration..."
GUIDE_PRESENT=$(timeout 10s node taskmanager-api.js init 2>/dev/null | jq -r '.guide.success // false')
if [ "$GUIDE_PRESENT" = "true" ]; then
    echo "   ✅ Guide integration working"
else
    echo "   ❌ Guide integration not working"
fi

# Check 4: Cache functionality
echo "4. Testing cache functionality..."
if [ -d ".guide-cache" ]; then
    CACHE_FILES=$(find .guide-cache -name "*.json" 2>/dev/null | wc -l)
    echo "   ✅ Cache directory exists ($CACHE_FILES files)"
else
    echo "   ⚠️  Cache directory not found (will be created)"
fi

# Check 5: Performance test
echo "5. Testing performance..."
START_TIME=$(date +%s%N)
timeout 10s node taskmanager-api.js init >/dev/null 2>&1
END_TIME=$(date +%s%N)
DURATION=$((($END_TIME - $START_TIME) / 1000000))

if [ $DURATION -lt 2000 ]; then
    echo "   ✅ Performance good (${DURATION}ms)"
elif [ $DURATION -lt 5000 ]; then
    echo "   ⚠️  Performance acceptable (${DURATION}ms)"
else
    echo "   ❌ Performance poor (${DURATION}ms)"
fi

# Check 6: Error recovery
echo "6. Testing error recovery..."
ERROR_GUIDE=$(timeout 10s node taskmanager-api.js claim nonexistent_task 2>&1 | jq -r '.guide.success // false')
if [ "$ERROR_GUIDE" = "true" ]; then
    echo "   ✅ Error recovery guidance working"
else
    echo "   ❌ Error recovery guidance not working"
fi

echo
echo "=== Health check complete ==="
```

### Guide Content Verification

```bash
#!/bin/bash
# verify-guide-content.sh

echo "=== Guide Content Verification ==="

# Test init endpoint guide
echo "Testing init endpoint guide content..."
INIT_GUIDE=$(timeout 10s node taskmanager-api.js init 2>/dev/null)

# Check for required sections
REQUIRED_SECTIONS=("focus" "quickStart" "essential_commands" "taskClassification")

for section in "${REQUIRED_SECTIONS[@]}"; do
    if echo "$INIT_GUIDE" | jq -e ".guide.$section" >/dev/null 2>&1; then
        echo "   ✅ $section present"
    else
        echo "   ❌ $section missing"
    fi
done

# Check quickStart content
QUICKSTART_COUNT=$(echo "$INIT_GUIDE" | jq -r '.guide.quickStart | length // 0')
if [ "$QUICKSTART_COUNT" -gt 0 ]; then
    echo "   ✅ quickStart has $QUICKSTART_COUNT items"
else
    echo "   ❌ quickStart is empty"
fi

# Check task classification
TASK_TYPES_COUNT=$(echo "$INIT_GUIDE" | jq -r '.guide.taskClassification.types | length // 0')
if [ "$TASK_TYPES_COUNT" -eq 4 ]; then
    echo "   ✅ All 4 task types present"
else
    echo "   ❌ Task types incomplete ($TASK_TYPES_COUNT/4)"
fi

echo "=== Verification complete ==="
```

## Recovery Procedures

### Complete System Reset

If all else fails, perform a complete reset:
```bash
#!/bin/bash
# complete-guide-system-reset.sh

echo "Performing complete guide system reset..."

# 1. Clear all caches
echo "Clearing caches..."
rm -rf .guide-cache/

# 2. Reset environment variables
echo "Resetting environment..."
unset GUIDE_INTEGRATION_ENABLED
unset GUIDE_MEMORY_CACHE_TTL
unset GUIDE_FILE_CACHE_TTL
unset GUIDE_MAX_CACHE_ENTRIES
unset GUIDE_MAX_SIZE
unset GUIDE_GENERATION_TIMEOUT

# 3. Test basic functionality
echo "Testing basic functionality..."
if timeout 10s node taskmanager-api.js methods >/dev/null 2>&1; then
    echo "✅ Basic API working"
else
    echo "❌ Basic API failed - check installation"
    exit 1
fi

# 4. Test guide generation
echo "Testing guide generation..."
if timeout 10s node taskmanager-api.js guide >/dev/null 2>&1; then
    echo "✅ Guide generation working"
else
    echo "❌ Guide generation failed"
    exit 1
fi

# 5. Test integration
echo "Testing guide integration..."
if timeout 10s node taskmanager-api.js init | jq -e '.guide.success' >/dev/null 2>&1; then
    echo "✅ Guide integration restored"
else
    echo "❌ Guide integration still failing"
    exit 1
fi

echo "✅ Complete reset successful"
```

## Getting Additional Help

### Log Collection
```bash
# Collect comprehensive logs for support
mkdir -p guide-debug-logs
timeout 10s node taskmanager-api.js init > guide-debug-logs/init-output.json 2>&1
timeout 10s node taskmanager-api.js guide > guide-debug-logs/guide-output.json 2>&1
timeout 10s node taskmanager-api.js methods > guide-debug-logs/methods-output.json 2>&1

# System information
uname -a > guide-debug-logs/system-info.txt
node --version > guide-debug-logs/node-version.txt
ls -la .guide-cache/ > guide-debug-logs/cache-listing.txt 2>&1

echo "Debug logs collected in guide-debug-logs/"
```

### Support Information Template
```bash
# Generate support information
cat > guide-support-info.txt << EOF
TaskManager API Guide Integration Support Request

System Information:
- OS: $(uname -a)
- Node.js: $(node --version)
- Date: $(date)

Issue Description:
[Describe your issue here]

Error Messages:
[Include any error messages]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Behavior:
[What you expected to happen]

Actual Behavior:
[What actually happened]

Diagnostic Results:
- Basic API: $(timeout 10s node taskmanager-api.js methods >/dev/null 2>&1 && echo "Working" || echo "Failed")
- Guide Generation: $(timeout 10s node taskmanager-api.js guide >/dev/null 2>&1 && echo "Working" || echo "Failed")
- Guide Integration: $(timeout 10s node taskmanager-api.js init | jq -r '.guide.success // "Failed"')
- Cache Status: $([ -d ".guide-cache" ] && echo "Present" || echo "Missing")

EOF

echo "Support information template created in guide-support-info.txt"
```

## Conclusion

This troubleshooting guide covers the most common issues with TaskManager API guide integration. The key to successful troubleshooting is:

1. **Start with basics** - Verify core functionality first
2. **Use diagnostic commands** - Systematically check each component
3. **Apply targeted solutions** - Address specific causes, not just symptoms
4. **Monitor performance** - Ensure solutions don't introduce new issues
5. **Document resolutions** - Keep track of what worked for future reference

For issues not covered in this guide, collect comprehensive diagnostic information using the provided scripts and contact support with detailed information about your environment and the specific problem encountered.

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-09-08  
**Component**: TaskManager API Guide Integration - Troubleshooting  
**Status**: Comprehensive Support Guide
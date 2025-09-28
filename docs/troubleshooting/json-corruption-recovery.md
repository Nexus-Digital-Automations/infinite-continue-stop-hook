# JSON Corruption Recovery - Troubleshooting Guide

**Version:** 1.0  
**Target Audience:** Developers and System Administrators  
**Last Updated:** 2025-09-07

## Quick Reference

### Emergency Recovery Commands

```bash
# Quick corruption check and auto-fix
node -e "const AutoFixer = require('./lib/autoFixer'); new AutoFixer().autoFix('./TODO.json').then(r => console.log(JSON.stringify(r, null, 2)))"

# Manual backup restoration (if backup exists)
cp TODO.json.backup TODO.json

# Create minimal valid structure (last resort)
echo '{"project":"recovery","tasks":[],"features":[],"agents":{},"current_mode":"DEVELOPMENT"}' > TODO.json
```

## Common Corruption Scenarios

### 1. Double-Encoded JSON String Corruption

#### Symptoms

- TODO.json file starts and ends with double quotes
- Content contains escaped newlines (`\\n`)
- Error message: "todoData.tasks is not iterable"
- File appears to contain JSON inside a string

#### Example Corrupted Content

```
"{\n  \"project\": \"infinite-continue-stop-hook\",\n  \"tasks\": [\n    {\n      \"id\": \"task_123\",\n      \"title\": \"Example Task\"\n    }\n  ]\n}"
```

#### Automatic Recovery

```javascript
// The system automatically detects and fixes this corruption
const AutoFixer = require('./lib/autoFixer');
const autoFixer = new AutoFixer();

const result = await autoFixer.autoFix('./TODO.json');
console.log('Recovery result:', result);
```

#### Manual Recovery

```bash
# Step 1: Check if automatic fix worked
node -e "
const fs = require('fs');
const content = fs.readFileSync('./TODO.json', 'utf8');
try {
  const parsed = JSON.parse(content);
  console.log('✅ File is valid JSON');
  console.log('Tasks count:', parsed.tasks?.length || 0);
} catch(e) {
  console.log('❌ Still corrupted:', e.message);
}
"

# Step 2: If still corrupted, manual fix
node -e "
const fs = require('fs');
const content = fs.readFileSync('./TODO.json', 'utf8');
if (content.startsWith('\"') && content.endsWith('\"')) {
  const fixed = JSON.parse(content).replace(/\\\\n/g, '\n');
  fs.writeFileSync('./TODO.json', fixed);
  console.log('✅ Manual fix applied');
} else {
  console.log('❌ Not a double-encoded string');
}
"
```

### 2. Malformed JSON Syntax

#### Symptoms

- JSON.parse() throws SyntaxError
- Missing commas, brackets, or quotes
- Truncated file (incomplete write)

#### Diagnostic Commands

```bash
# Check JSON syntax
node -e "
try {
  JSON.parse(require('fs').readFileSync('./TODO.json', 'utf8'));
  console.log('✅ Valid JSON');
} catch(e) {
  console.log('❌ Invalid JSON:', e.message);
}"

# Show problematic lines
node -e "
const fs = require('fs');
const content = fs.readFileSync('./TODO.json', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('undefined') || line.match(/[^\\],\s*[}\\]]/)) {
    console.log(\`Line \${i+1}: \${line}\`);
  }
});
"
```

#### Recovery Steps

```bash
# Step 1: Try automatic recovery
node -e "
const AutoFixer = require('./lib/autoFixer');
new AutoFixer().autoFix('./TODO.json').then(result => {
  if (result.fixed) {
    console.log('✅ Automatically fixed:', result.fixesApplied);
  } else {
    console.log('❌ Auto-fix failed:', result.issues);
  }
});
"

# Step 2: If auto-fix fails, check for backup
ls -la TODO.json.backup TODO.json.pre-write-backup 2>/dev/null

# Step 3: Restore from backup if available
cp TODO.json.backup TODO.json  # or TODO.json.pre-write-backup
```

### 3. Missing or Empty File

#### Symptoms

- File does not exist
- File exists but is empty (0 bytes)
- Error: "ENOENT: no such file or directory"

#### Recovery

```bash
# Check file status
ls -la TODO.json 2>/dev/null || echo "File does not exist"

# Create minimal valid structure
node -e "
const fs = require('fs');
const minimalStructure = {
  project: 'infinite-continue-stop-hook',
  tasks: [],
  features: [],
  agents: {},
  current_mode: 'DEVELOPMENT',
  last_mode: null,
  execution_count: 0,
  review_strikes: 0,
  strikes_completed_last_run: false,
  last_hook_activation: Date.now(),
  settings: {
    auto_sort_enabled: true,
    sort_criteria: {
      primary: 'id_prefix',
      secondary: 'created_at'
    },
    priority_values: {
      critical: 4, high: 3, medium: 2, low: 1
    },
    category_enabled: true,
    id_based_classification: true,
    id_priority_order: {
      'error_': 1, 'feature_': 2, 'subtask_': 3, 'test_': 4
    }
  }
};

fs.writeFileSync('./TODO.json', JSON.stringify(minimalStructure, null, 2));
console.log('✅ Created minimal TODO.json structure');
"
```

### 4. Agent Corruption Issues

#### Symptoms

- "Agent not found" errors
- Agents not properly registered
- Tasks claimed by non-existent agents

#### Diagnostic

```bash
# Check agent registry
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  console.log('Active agents:', Object.keys(data.agents || {}));
  console.log('Total agents:', Object.keys(data.agents || {}).length);

  // Check for stale agents
  const now = Date.now();
  Object.entries(data.agents || {}).forEach(([id, agent]) => {
    const lastSeen = new Date(agent.lastHeartbeat).getTime();
    const staleMinutes = (now - lastSeen) / (1000 * 60);
    if (staleMinutes > 15) {
      console.log(\`⚠️ Stale agent: \${id} (inactive \${staleMinutes.toFixed(1)} minutes)\`);
    }
  });
});
"
```

#### Recovery

```bash
# Clean up stale agents
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(async data => {
  const now = Date.now();
  let cleaned = 0;

  Object.keys(data.agents || {}).forEach(agentId => {
    const agent = data.agents[agentId];
    const lastSeen = new Date(agent.lastHeartbeat).getTime();
    const staleMinutes = (now - lastSeen) / (1000 * 60);

    if (staleMinutes > 15) {
      delete data.agents[agentId];
      cleaned++;
    }
  });

  if (cleaned > 0) {
    await tm.writeTodo(data);
    console.log(\`✅ Cleaned up \${cleaned} stale agents\`);
  } else {
    console.log('No stale agents found');
  }
});
"

# Reset all agent assignments
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(async data => {
  let reset = 0;
  data.tasks.forEach(task => {
    if (task.assigned_agent || task.claimed_by) {
      task.assigned_agent = null;
      task.claimed_by = null;
      task.status = task.status === 'in_progress' ? 'pending' : task.status;
      reset++;
    }
  });

  if (reset > 0) {
    await tm.writeTodo(data);
    console.log(\`✅ Reset \${reset} task assignments\`);
  }
});
"
```

## Advanced Recovery Procedures

### Full System Recovery

#### When to Use

- Multiple corruption types detected
- Automatic recovery consistently fails
- System completely non-functional

#### Procedure

```bash
# 1. Create emergency backup
cp TODO.json TODO.json.emergency-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null

# 2. Extract as much data as possible
node -e "
const fs = require('fs');
try {
  const content = fs.readFileSync('./TODO.json', 'utf8');

  // Try to extract tasks even from corrupted JSON
  const taskMatches = content.match(/\"id\":\\s*\"[^\"]+\"/g) || [];
  const titleMatches = content.match(/\"title\":\\s*\"[^\"]+\"/g) || [];

  console.log('Found', taskMatches.length, 'task IDs');
  console.log('Found', titleMatches.length, 'task titles');

  // Save extracted data for manual recovery
  fs.writeFileSync('extracted-data.txt',
    'Task IDs:\\n' + taskMatches.join('\\n') +
    '\\n\\nTask Titles:\\n' + titleMatches.join('\\n'));

  console.log('✅ Extracted data saved to extracted-data.txt');
} catch(e) {
  console.log('❌ Data extraction failed:', e.message);
}
"

# 3. Create clean structure
node -e "
const fs = require('fs');
const cleanStructure = {
  project: 'infinite-continue-stop-hook',
  tasks: [],
  features: [],
  agents: {},
  current_mode: 'DEVELOPMENT',
  settings: {
    auto_sort_enabled: true,
    id_based_classification: true,
    id_priority_order: { 'error_': 1, 'feature_': 2, 'subtask_': 3, 'test_': 4 }
  }
};

fs.writeFileSync('./TODO.json', JSON.stringify(cleanStructure, null, 2));
console.log('✅ Clean TODO.json structure created');
"

# 4. Validate the new structure
node -e "
const TaskManager = require('./lib/taskManager');
const tm = new TaskManager('./TODO.json');
tm.readTodo().then(data => {
  console.log('✅ TODO.json is now valid');
  console.log('Project:', data.project);
  console.log('Tasks:', data.tasks.length);
  console.log('Features:', data.features?.length || 0);
});
"
```

### Preventive Maintenance

#### Regular Health Checks

```bash
# Daily health check script
node -e "
const AutoFixer = require('./lib/autoFixer');
const autoFixer = new AutoFixer();

autoFixer.getFileStatus('./TODO.json').then(status => {
  console.log('File Status Report:');
  console.log('- Exists:', status.exists);
  console.log('- Size:', status.size, 'bytes');
  console.log('- Issues:', status.issues.length);

  if (status.issues.length > 0) {
    console.log('Issues found:', status.issues);

    autoFixer.autoFix('./TODO.json').then(fixResult => {
      if (fixResult.fixed) {
        console.log('✅ Issues automatically resolved:', fixResult.fixesApplied);
      } else {
        console.log('❌ Manual intervention required');
      }
    });
  } else {
    console.log('✅ File is healthy');
  }
});
"
```

#### Backup Verification

```bash
# Verify backup integrity
for backup in TODO.json.backup TODO.json.pre-write-backup; do
  if [ -f "$backup" ]; then
    echo "Checking $backup..."
    node -e "
    try {
      const data = JSON.parse(require('fs').readFileSync('$backup', 'utf8'));
      console.log('✅ $backup is valid JSON');
      console.log('  - Tasks: ' + (data.tasks?.length || 0));
      console.log('  - Features: ' + (data.features?.length || 0));
    } catch(e) {
      console.log('❌ $backup is corrupted:', e.message);
    }
    "
  else
    echo "$backup does not exist"
  fi
done
```

## Monitoring and Alerting

### Log Pattern Monitoring

```bash
# Monitor for corruption events in logs
grep -i "corruption\|double-encoded\|prevented.*json" *.log | tail -20

# Count corruption prevention events
grep -c "PREVENTED JSON CORRUPTION" *.log 2>/dev/null || echo "No prevention events found"

# Recent auto-fix events
grep "STOP HOOK: Automatically fixed" *.log 2>/dev/null | tail -10
```

### System Health Metrics

```bash
# Check file modification patterns
ls -lat TODO.json* | head -10

# Monitor file size trends (unusually small files indicate corruption)
wc -c TODO.json TODO.json.backup 2>/dev/null

# Check for temporary files (might indicate interrupted operations)
ls -la TODO.json.tmp TODO.json.*.tmp 2>/dev/null || echo "No temporary files found"
```

## Error Message Reference

### Common Error Messages and Solutions

| Error Message                           | Root Cause                      | Solution                                |
| --------------------------------------- | ------------------------------- | --------------------------------------- |
| `todoData.tasks is not iterable`        | Double-encoded JSON string      | Run `autoFixer.autoFix()`               |
| `JSON.parse() failed`                   | Malformed JSON syntax           | Check for syntax errors, use auto-fix   |
| `Agent not found`                       | Stale agent reference           | Clean agent registry                    |
| `Invalid data type for TODO.json write` | String passed to write function | Fix calling code to pass objects        |
| `TODO.json data cannot be a string`     | Corruption prevention triggered | Review data source, fix double-encoding |
| `File does not exist`                   | Missing TODO.json               | Create minimal structure                |
| `Failed to write TODO.json`             | File system or permission issue | Check permissions, disk space           |

### Stop Hook Error Messages

```
⚠️ STOP HOOK ERROR - CONTINUING ANYWAY
Error encountered: todoData.tasks is not iterable
```

**Solution**: Double-encoded JSON corruption - run auto-fix

```
⚠️ STOP HOOK: Corruption check failed: autoFixer.fixJsonFile is not a function
```

**Solution**: Method name error - use `autoFixer.autoFix()` instead

```
🔧 STOP HOOK: Automatically fixed TODO.json corruption - Fixed escaped JSON string corruption
```

**Status**: Successful automatic recovery

## Contact and Escalation

### When to Escalate

- Automatic recovery consistently fails
- Data loss suspected or confirmed
- System completely non-functional after recovery attempts
- Corruption occurs repeatedly (>3 times per day)

### Escalation Information

- **Primary Contact**: System Administrator
- **Documentation**: This guide + system architecture docs
- **Required Information**:
  - Corruption timeline
  - Error messages (exact text)
  - Recovery attempts made
  - Current system status
  - Backup availability

### Emergency Procedures

1. **Immediate**: Stop all TaskManager operations
2. **Backup**: Save all TODO.json.\* files with timestamps
3. **Document**: Record exact error messages and timestamps
4. **Recover**: Apply appropriate recovery procedure from this guide
5. **Test**: Validate system functionality after recovery
6. **Monitor**: Watch for recurring issues

---

**Document Information**

- **Version**: 1.0
- **Last Updated**: 2025-09-07
- **Next Review**: 2025-12-07
- **Related Documents**: json-corruption-prevention-system.md, README.md

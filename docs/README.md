# TaskManager API Documentation

## Overview
This directory contains comprehensive documentation for the simplified TaskManager API and stop hook system, focusing on the critical JSON corruption prevention system that ensures data integrity.

## Documentation Structure

### Architecture Documentation
- **[JSON Corruption Prevention System](architecture/json-corruption-prevention-system.md)** - Comprehensive technical documentation of the multi-layered corruption prevention architecture

### Troubleshooting Guides
- **[JSON Corruption Recovery](troubleshooting/json-corruption-recovery.md)** - Complete troubleshooting guide with recovery procedures for all corruption scenarios

### Quick Reference

#### Emergency Recovery
```bash
# Auto-fix corruption
node -e "const AutoFixer = require('./lib/autoFixer'); new AutoFixer().autoFix('./TODO.json').then(r => console.log(JSON.stringify(r, null, 2)))"

# Create minimal structure (last resort)
echo '{"project":"recovery","tasks":[],"features":[],"agents":{},"current_mode":"DEVELOPMENT"}' > TODO.json
```

#### System Health Check
```bash
# Check file status
node -e "const AutoFixer = require('./lib/autoFixer'); new AutoFixer().getFileStatus('./TODO.json').then(s => console.log(s))"

# Validate JSON structure
node -e "try { JSON.parse(require('fs').readFileSync('./TODO.json', 'utf8')); console.log('✅ Valid JSON'); } catch(e) { console.log('❌ Invalid:', e.message); }"
```

## Key Features Documented

### JSON Corruption Prevention System
- **Multi-layer Protection**: Input validation, encoding prevention, atomic operations, and recovery systems
- **Automatic Detection**: Real-time corruption detection and repair
- **Comprehensive Recovery**: Intelligent repair strategies for various corruption types
- **Performance Optimized**: Minimal overhead with maximum protection

### Component Integration
- **AutoFixer Engine**: Core corruption detection and repair functionality
- **TaskManager Integration**: Seamless integration with corruption prevention at all critical points
- **Stop Hook Protection**: Real-time corruption detection and automatic repair
- **Test Suite Validation**: Comprehensive test coverage ensuring system reliability

## Documentation Standards

All documentation in this directory follows these standards:
- **Version Controlled**: Each document includes version and update information
- **Actionable Content**: Includes executable commands and code examples
- **Comprehensive Coverage**: Complete information for both developers and system administrators
- **Cross-Referenced**: Documents link to related information and dependencies
- **Tested Procedures**: All recovery procedures have been tested and validated

## Getting Help

### For Developers
- Start with the [Architecture Documentation](architecture/json-corruption-prevention-system.md) to understand the system design
- Use the [Troubleshooting Guide](troubleshooting/json-corruption-recovery.md) for specific issues
- Reference the main [README.md](../README.md) for general system usage

### For System Administrators  
- Use the [Troubleshooting Guide](troubleshooting/json-corruption-recovery.md) for operational issues
- Monitor system health using the monitoring commands provided in the documentation
- Implement preventive maintenance procedures as outlined in the guides

### For Emergency Situations
- **Step 1**: Stop all TaskManager operations
- **Step 2**: Follow the emergency recovery procedures in the troubleshooting guide
- **Step 3**: Validate system functionality after recovery
- **Step 4**: Implement monitoring to prevent recurrence

---

**Document Information**
- **Last Updated**: 2025-09-07
- **Maintained By**: Claude Code AI Assistant
- **Review Schedule**: Quarterly
- **Related Systems**: TaskManager API, Stop Hook System, AutoFixer Engine
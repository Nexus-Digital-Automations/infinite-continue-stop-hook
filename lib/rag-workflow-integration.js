/**
 * RAG Workflow Integration
 * Updates existing agent protocols and workflows to automatically use RAG system
 * Provides backward compatibility bridge with file-based lessons structure
 */

const _path = require('path');
const _fs = require('fs');
const _RAGDatabase = require('./rag-database');

class RAGWorkflowIntegration {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.ragDB = new _RAGDatabase();
    this.initialized = false;
  }

  /**
   * Initialize RAG workflow integration
   */
  async initialize() {
    if (!this.initialized) {
      const result = await this.ragDB.initialize();
      this.initialized = result.success;
      return result;
    }
    return { success: true, message: 'RAG workflow integration already initialized' };
  }

  /**
   * Update CLAUDE.md with enhanced RAG workflow protocols
   */
  updateClaudeProtocols() {
    const claudeMdPath = _path.join(this.projectRoot, 'CLAUDE.md');

    if (!_fs.existsSync(claudeMdPath)) {
      console.log('[RAG-WORKFLOW] CLAUDE.md not found, skipping protocol update');
      return { success: true, message: 'CLAUDE.md not found, protocols not updated' };
    }

    try {
      const currentContent = _fs.readFileSync(claudeMdPath, 'utf8');

      // Check if RAG protocols are already integrated
      if (currentContent.includes('RAG SYSTEM INTEGRATION')) {
        return { success: true, message: 'RAG protocols already integrated in CLAUDE.md' };
      }

      // Add RAG integration section to CLAUDE.md
      const ragProtocolsSection = this._generateRagProtocolsSection();
      const updatedContent = this._insertRagProtocols(currentContent, ragProtocolsSection);

      // Backup original file
      const backupPath = `${claudeMdPath}.backup.${Date.now()}`;
      _fs.writeFileSync(backupPath, currentContent);

      // Write updated content
      _fs.writeFileSync(claudeMdPath, updatedContent);

      console.log('[RAG-WORKFLOW] CLAUDE.md updated with RAG protocols');
      return {
        success: true,
        message: 'CLAUDE.md updated with RAG workflow integration',
        backupPath,
      };

    } catch (error) {
      console.error('[RAG-WORKFLOW] Failed to update CLAUDE.md:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backward compatibility bridge for file-based lesson access
   */
  createBackwardCompatibilityBridge() {
    const bridgeScript = this._generateBridgeScript();
    const bridgePath = _path.join(this.projectRoot, 'development', 'lessons', 'rag-bridge.js');

    // Ensure development/lessons directory exists
    const lessonsDir = _path.dirname(bridgePath);
    if (!_fs.existsSync(lessonsDir)) {
      _fs.mkdirSync(lessonsDir, { recursive: true });
    }

    try {
      _fs.writeFileSync(bridgePath, bridgeScript);
      console.log('[RAG-WORKFLOW] Created backward compatibility bridge at:', bridgePath);

      return {
        success: true,
        message: 'Backward compatibility bridge created',
        bridgePath,
      };

    } catch (error) {
      console.error('[RAG-WORKFLOW] Failed to create bridge:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create pre-task preparation script for agents
   */
  async createPreTaskPreparationScript() {
    const scriptContent = this._generatePreTaskScript();
    const scriptPath = _path.join(this.projectRoot, 'development', 'essentials', 'rag-pre-task.js');

    // Ensure development/essentials directory exists
    const essentialsDir = _path.dirname(scriptPath);
    if (!_fs.existsSync(essentialsDir)) {
      _fs.mkdirSync(essentialsDir, { recursive: true });
    }

    try {
      _fs.writeFileSync(scriptPath, scriptContent);
      console.log('[RAG-WORKFLOW] Created pre-task preparation script at:', scriptPath);

      return {
        success: true,
        message: 'Pre-task preparation script created',
        scriptPath,
      };

    } catch (error) {
      console.error('[RAG-WORKFLOW] Failed to create pre-task script:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Integrate with existing TaskManager for automatic lesson storage
   */
  async integrateWithTaskManager() {
    // This would typically modify the TaskManager to automatically call RAG operations
    // Since we've already added RAG operations to the TaskManager API, this is a verification step

    const taskManagerPath = _path.join(this.projectRoot, 'taskmanager-api.js');

    if (!_fs.existsSync(taskManagerPath)) {
      return { success: false, error: 'TaskManager API not found' };
    }

    try {
      const content = _fs.readFileSync(taskManagerPath, 'utf8');

      // Check if RAG operations are already integrated
      const hasRagOperations = content.includes('RAGOperations') && content.includes('ragOperations');

      if (hasRagOperations) {
        console.log('[RAG-WORKFLOW] TaskManager already has RAG operations integrated');
        return {
          success: true,
          message: 'TaskManager already integrated with RAG system',
          alreadyIntegrated: true,
        };
      } else {
        return {
          success: false,
          error: 'TaskManager RAG integration not detected. Manual integration may be required.',
          requiresManualIntegration: true,
        };
      }

    } catch (error) {
      console.error('[RAG-WORKFLOW] Failed to check TaskManager integration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Perform complete workflow integration
   */
  async performCompleteIntegration() {
    console.log('[RAG-WORKFLOW] Starting complete RAG workflow integration...');

    const results = {
      initialization: await this.initialize(),
      claudeProtocols: this.updateClaudeProtocols(),
      backwardCompatibility: this.createBackwardCompatibilityBridge(),
      preTaskScript: await this.createPreTaskPreparationScript(),
      taskManagerIntegration: await this.integrateWithTaskManager(),
    };

    // Check overall success
    const allSuccessful = Object.values(results).every(result => result.success);

    console.log(`[RAG-WORKFLOW] Integration completed with ${allSuccessful ? 'SUCCESS' : 'WARNINGS'}`);

    return {
      success: allSuccessful,
      integrationResults: results,
      summary: this._generateIntegrationSummary(results),
      message: allSuccessful ? 'RAG workflow integration completed successfully' : 'RAG workflow integration completed with warnings',
    };
  }

  // =================== HELPER METHODS ===================

  /**
   * Generate RAG protocols section for CLAUDE.md
   */
  _generateRagProtocolsSection() {
    return `
## 🚨 RAG SYSTEM INTEGRATION
**ENHANCED AGENT SELF-LEARNING WITH RAG DATABASE**

### 🧠 AUTOMATIC LESSON STORAGE & RETRIEVAL
**MANDATORY INTEGRATION WITH ALL WORKFLOWS:**

**PRE-TASK PREPARATION:**
\`\`\`bash
# REQUIRED: Get relevant lessons before starting any task
timeout 10s node taskmanager-api.js get-relevant-lessons '{"title":"[Task Title]", "category":"[Task Category]", "description":"[Task Description]"}'
\`\`\`

**POST-TASK LESSON STORAGE:**
- **AUTOMATIC**: Feature tasks auto-store lessons in RAG database upon completion
- **MANUAL**: Use \`store-lesson\` command for additional insights
\`\`\`bash
# Manual lesson storage for important discoveries
timeout 10s node taskmanager-api.js store-lesson '{"title":"Lesson Title", "content":"Detailed lesson content", "category":"features", "tags":["tag1", "tag2"]}'
\`\`\`

**ERROR PATTERN RECOGNITION:**
\`\`\`bash
# Find similar errors before attempting fixes
timeout 10s node taskmanager-api.js find-similar-errors "Error description here"
\`\`\`

**KNOWLEDGE SEARCH:**
\`\`\`bash
# Search lessons by topic/technology
timeout 10s node taskmanager-api.js search-lessons "search query" '{"category":"features", "limit":5}'

# Get RAG system analytics
timeout 10s node taskmanager-api.js rag-analytics '{"includeTrends":true}'
\`\`\`

### 📋 ENHANCED WORKFLOW REQUIREMENTS
**MANDATORY PRE-TASK SEQUENCE:**
1. **Initialize TaskManager**: \`timeout 10s node taskmanager-api.js init\`
2. **Create Task**: \`timeout 10s node taskmanager-api.js create '[task-data]'\`
3. **🆕 GET RELEVANT LESSONS**: \`timeout 10s node taskmanager-api.js get-relevant-lessons '[task-context]'\`
4. **Review Retrieved Knowledge**: Apply relevant patterns and avoid known pitfalls
5. **Execute Task**: Implement solution with learned insights
6. **Complete Task**: \`timeout 10s node taskmanager-api.js complete '[task-id]' '[completion-data]'\`
7. **🆕 LESSON AUTO-STORED**: System automatically captures successful feature implementations

### 🔄 CROSS-PROJECT KNOWLEDGE TRANSFER
**GLOBAL LEARNING NETWORK:**
- All lessons stored with project context and universal tags
- Cross-project pattern recognition and solution transfer
- Centralized error resolution database with similarity matching
- Technology-specific knowledge clustering (React, Node.js, API, Database, etc.)

### 🎯 RAG-ENHANCED DEVELOPMENT PATTERNS
**INTELLIGENT PROBLEM SOLVING:**
- **Error-First Approach**: Always check similar errors before attempting fixes
- **Pattern Recognition**: Apply successful patterns from similar tasks
- **Knowledge Accumulation**: Each task builds the collective intelligence
- **Context-Aware Suggestions**: Receive relevant lessons based on current task context

### 📊 RAG SYSTEM COMMANDS
**CORE RAG OPERATIONS:**
- \`store-lesson\` - Manually store important lessons
- \`store-error\` - Manually store error patterns and resolutions
- \`search-lessons\` - Query lessons by content/tags
- \`find-similar-errors\` - Find matching error patterns
- \`get-relevant-lessons\` - Get contextual lessons for current task
- \`rag-analytics\` - View system statistics and trends

**INTEGRATION STATUS**: RAG system seamlessly integrated with TaskManager workflows
**BACKWARD COMPATIBILITY**: Existing development/lessons structure remains functional
**MIGRATION**: Legacy lessons automatically migrated to RAG database on first use

`;
  }

  /**
   * Insert RAG protocols into existing CLAUDE.md content
   */
  _insertRagProtocols(currentContent, ragSection) {
    // Find a good insertion point (after core principles, before detailed sections)
    const insertionPoints = [
      '## 🚨 IMMEDIATE ACTION PROTOCOL',
      '## 🚨 CRITICAL MANDATES',
      '## 🎯 TASK MANAGEMENT & GIT WORKFLOW',
    ];

    for (const insertionPoint of insertionPoints) {
      const index = currentContent.indexOf(insertionPoint);
      if (index !== -1) {
        return currentContent.slice(0, index) + ragSection + '\n' + currentContent.slice(index);
      }
    }

    // Fallback: append to end
    return currentContent + '\n' + ragSection;
  }

  /**
   * Generate backward compatibility bridge script
   */
  _generateBridgeScript() {
    return `/**
 * RAG Backward Compatibility Bridge
 * Provides file-based interface that queries RAG database
 * Maintains compatibility with legacy lesson access patterns
 */

const _RAGDatabase = require('../../lib/rag-database');

class LegacyLessonsBridge {
  constructor() {
    this.ragDB = new _RAGDatabase();
    this.initialized = false;
  }

  async _ensureInitialized() {
    if (!this.initialized) {
      const result = await this.ragDB.initialize();
      this.initialized = result.success;
    }
  }

  /**
   * Get lessons by category (mimics file-based structure)
   */
  async getLessons(category = null) {
    await this._ensureInitialized();

    const options = { limit: 50 };
    if (category) options.category = category;

    const result = await this.ragDB.searchLessons('', 50, 0.1); // Low threshold to get all
    return result.lessons || [];
  }

  /**
   * Get errors by type (mimics file-based structure)
   */
  async getErrors(errorType = null) {
    await this._ensureInitialized();

    const options = { limit: 50 };
    if (errorType) options.errorType = errorType;

    const result = await this.ragDB.searchErrors('', 50, 0.1); // Low threshold to get all
    return result.errors || [];
  }

  /**
   * Search for specific lessons (enhanced functionality)
   */
  async searchLessons(query, category = null) {
    await this._ensureInitialized();

    const options = { limit: 20, threshold: 0.7 };
    if (category) options.category = category;

    const result = await this.ragDB.searchLessons(query, 20, 0.7);
    return result.lessons || [];
  }

  /**
   * Find similar errors (enhanced functionality)
   */
  async findSimilarErrors(errorDescription) {
    await this._ensureInitialized();

    const result = await this.ragDB.searchErrors(errorDescription, 10, 0.8);
    return result.errors || [];
  }

  async close() {
    if (this.ragDB) {
      await this.ragDB.close();
    }
  }
}

module.exports = LegacyLessonsBridge;

// Usage example:
// const bridge = new LegacyLessonsBridge();
// const lessons = await bridge.getLessons('features');
// const errors = await bridge.getErrors('linter');
`;
  }

  /**
   * Generate pre-task preparation script
   */
  _generatePreTaskScript() {
    return `/**
 * RAG Pre-Task Preparation Script
 * Automatically retrieves relevant lessons and errors before task execution
 * Integrates with agent workflows for enhanced problem-solving
 */

const _RAGDatabase = require('../../lib/rag-database');

class RAGPreTaskPreparation {
  constructor() {
    this.ragDB = new _RAGDatabase();
    this.initialized = false;
  }

  async _ensureInitialized() {
    if (!this.initialized) {
      const result = await this.ragDB.initialize();
      this.initialized = result.success;
    }
  }

  /**
   * Prepare for task execution by retrieving relevant knowledge
   */
  async prepareForTask(taskContext) {
    await this._ensureInitialized();

    const searchQuery = this._buildSearchQuery(taskContext);

    console.log(\`[RAG-PREP] Retrieving relevant knowledge for: \${taskContext.title}\`);

    // Get relevant lessons
    const lessonsResult = await this.ragDB.searchLessons(searchQuery, 5, 0.6);

    // Get related errors
    const errorsResult = await this.ragDB.searchErrors(searchQuery, 3, 0.7);

    const preparation = {
      taskContext: {
        title: taskContext.title,
        category: taskContext.category,
        searchQuery
      },
      relevantLessons: lessonsResult.lessons || [],
      relatedErrors: errorsResult.errors || [],
      recommendations: this._generateRecommendations(lessonsResult.lessons, errorsResult.errors),
      summary: {
        lessonsFound: (lessonsResult.lessons || []).length,
        errorsFound: (errorsResult.errors || []).length,
        hasRelevantKnowledge: (lessonsResult.lessons || []).length > 0 || (errorsResult.errors || []).length > 0
      }
    };

    this._displayPreparationSummary(preparation);

    return preparation;
  }

  /**
   * Build search query from task context
   */
  _buildSearchQuery(taskContext) {
    const parts = [
      taskContext.title,
      taskContext.category,
      (taskContext.description || '').split(' ').slice(0, 10).join(' ')
    ].filter(part => part && part.trim());

    return parts.join(' ');
  }

  /**
   * Generate recommendations based on retrieved knowledge
   */
  _generateRecommendations(lessons, errors) {
    const recommendations = [];

    if (lessons && lessons.length > 0) {
      recommendations.push({
        type: 'pattern',
        message: \`Found \${lessons.length} relevant lessons from similar tasks\`,
        action: 'Review lesson patterns and apply successful approaches'
      });
    }

    if (errors && errors.length > 0) {
      recommendations.push({
        type: 'caution',
        message: \`Found \${errors.length} related errors from previous attempts\`,
        action: 'Review error patterns to avoid known pitfalls'
      });
    }

    if ((!lessons || lessons.length === 0) && (!errors || errors.length === 0)) {
      recommendations.push({
        type: 'exploration',
        message: 'No directly relevant knowledge found',
        action: 'Proceed with careful implementation and document lessons learned'
      });
    }

    return recommendations;
  }

  /**
   * Display preparation summary to console
   */
  _displayPreparationSummary(preparation) {
    console.log('\\n[RAG-PREP] ═══ TASK PREPARATION SUMMARY ═══');
    console.log(\`Task: \${preparation.taskContext.title}\`);
    console.log(\`Category: \${preparation.taskContext.category}\`);
    console.log(\`Relevant Lessons: \${preparation.summary.lessonsFound}\`);
    console.log(\`Related Errors: \${preparation.summary.errorsFound}\`);

    if (preparation.recommendations.length > 0) {
      console.log('\\nRecommendations:');
      preparation.recommendations.forEach((rec, index) => {
        console.log(\`\${index + 1}. [\${rec.type.toUpperCase()}] \${rec.message}\`);
        console.log(\`   → \${rec.action}\`);
      });
    }

    console.log('\\n[RAG-PREP] ═══ END PREPARATION SUMMARY ═══\\n');
  }

  async close() {
    if (this.ragDB) {
      await this.ragDB.close();
    }
  }
}

module.exports = RAGPreTaskPreparation;

// CLI Usage:
// const prep = new RAGPreTaskPreparation();
// await prep.prepareForTask({
//   title: "Task title here",
//   category: "feature",
//   description: "Task description here"
// });
`;
  }

  /**
   * Generate integration summary
   */
  _generateIntegrationSummary(results) {
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;

    return {
      successful,
      total,
      successRate: Math.round((successful / total) * 100),
      components: {
        initialization: results.initialization.success ? 'COMPLETED' : 'FAILED',
        claudeProtocols: results.claudeProtocols.success ? 'COMPLETED' : 'FAILED',
        backwardCompatibility: results.backwardCompatibility.success ? 'COMPLETED' : 'FAILED',
        preTaskScript: results.preTaskScript.success ? 'COMPLETED' : 'FAILED',
        taskManagerIntegration: results.taskManagerIntegration.success ? 'COMPLETED' : 'REQUIRES ATTENTION',
      },
      status: successful === total ? 'FULLY INTEGRATED' : 'PARTIALLY INTEGRATED',
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.ragDB) {
      await this.ragDB.close();
    }
  }
}

module.exports = RAGWorkflowIntegration;

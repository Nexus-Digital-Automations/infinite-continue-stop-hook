/**
 * Agent Management Module
 *
 * Handles all agent lifecycle operations including:
 * - Agent initialization and registration
 * - Agent status tracking and heartbeat renewal
 * - Agent reinitialization scenarios
 * - Current task retrieval for agents
 * - Listing all active agents
 * - Agent scope validation
 * - Usage tracking for init/reinitialize operations
 *
 * @author TaskManager System
 * @version 2.0.0
 */

const UsageTracker = require('../../usageTracker');

class AgentManagement {
  /**
   * Initialize AgentManagement with required dependencies
   * @param {Object} agentManager - AgentManager instance
   * @param {Object} taskManager - TaskManager instance
   * @param {Function} withTimeout - Timeout wrapper function
   * @param {Function} getGuideForError - Error guide function
   * @param {Function} getFallbackGuide - Fallback guide function
   */
  constructor(dependencies) {
    this.agentManager = dependencies.agentManager;
    this.taskManager = dependencies.taskManager;
    this.withTimeout = dependencies.withTimeout;
    this.getGuideForError = dependencies.getGuideForError;
    this.getFallbackGuide = dependencies.getFallbackGuide;

    // Initialize usage tracker for monitoring init/reinitialize calls
    this.usageTracker = new UsageTracker();
  }

  /**
   * Initialize a new agent with the TaskManager system
   */
  async initAgent(config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-lifecycle');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const agent = await this.agentManager.createAgent(config);

          // Track usage for analytics (non-blocking)
          this.usageTracker.trackCall('init', agent.agentId, agent.sessionId)
            .catch(error => {
              // Log but don't fail the init process
              console.warn(`Usage tracking failed for init: ${error.message}`);
            });

          return {
            success: true,
            agentId: agent.agentId,
            agent: agent,
            message: 'Agent initialized successfully',
            sessionInfo: {
              sessionId: agent.sessionId,
              createdAt: agent.createdAt,
              capabilities: agent.capabilities,
              workload: agent.workload,
              maxConcurrentTasks: agent.maxConcurrentTasks,
            },
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    }
  }

  /**
   * Get the current task assigned to an agent
   */
  async getCurrentTask(agentId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-lifecycle');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const currentTask = await this.taskManager.getCurrentTaskForAgent(agentId);

          return {
            success: true,
            agentId: agentId,
            currentTask: currentTask,
            hasTask: currentTask !== null,
            message: currentTask
              ? `Agent ${agentId} currently assigned to task: ${currentTask.id}`
              : `Agent ${agentId} has no current task assignment`,
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    }
  }

  /**
   * Get status information for a specific agent
   */
  async getAgentStatus(agentId) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-lifecycle');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const agent = await this.agentManager.getAgent(agentId);

          if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
          }

          // Get current tasks for this agent
          const currentTasks = await this.taskManager.getTasksForAgent(agentId);

          return {
            success: true,
            agentId: agentId,
            agent: agent,
            currentTasks: currentTasks,
            taskCount: currentTasks.length,
            status: {
              isActive: agent.status === 'active',
              lastHeartbeat: agent.lastHeartbeat,
              workload: agent.workload,
              maxConcurrentTasks: agent.maxConcurrentTasks,
              capabilities: agent.capabilities,
            },
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    }
  }

  /**
   * Reinitialize an existing agent (requires explicit agent ID)
   */
  async reinitializeAgent(agentId, config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-reinit');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          // Validate that agent ID is provided explicitly
          if (!agentId) {
            throw new Error(
              'Agent ID required for reinitialization. Use your agent ID from previous init command.\n' +
              'Examples:\n' +
              '1. Run: list-agents command\n' +
              '2. Copy the agentId from the output\n' +
              '3. Use that agentId in your reinitialize command\n' +
              "\nIf no agents exist, use 'init' to create a new agent first.",
            );
          }

          const detectedScenario = 'explicit_agent_required';

          // Verify the agent exists
          const agent = await this.agentManager.getAgent(agentId);
          if (!agent) {
            throw new Error(
              `Agent ${agentId} not found. Use 'init' to create a new agent or check available agents with 'list-agents'.`,
            );
          }

          return this.performReinitializeWithScenario(
            agentId,
            config,
            detectedScenario,
            guide,
          );
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-reinit'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-reinit'),
      };
    }
  }

  /**
   * Smart agent reinitialization with scenario detection
   */
  async smartReinitializeAgent(agentId, config = {}) {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-reinit');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          let detectedScenario = 'unknown';
          let targetAgentId = agentId;

          // Scenario detection logic
          if (agentId) {
            // Agent ID provided - validate and use it
            const agent = await this.agentManager.getAgent(agentId);
            if (agent) {
              detectedScenario = 'explicit_agent_renewal';
            } else {
              throw new Error(`Agent ${agentId} not found. Use 'init' to create a new agent.`);
            }
          } else {
            // No agent ID provided - check for existing agents
            const activeAgents = await this.agentManager.listActiveAgents();
            if (activeAgents.length === 1) {
              targetAgentId = activeAgents[0].agentId;
              detectedScenario = 'single_agent_auto_renewal';
            } else if (activeAgents.length > 1) {
              detectedScenario = 'multiple_agents_explicit_required';
              throw new Error(
                'Multiple agents found. Please specify which agent to reinitialize:\n' +
                activeAgents.map(a => `  - ${a.agentId} (${a.role}, created: ${a.createdAt})`).join('\n') +
                '\n\nUse: reinitialize <agentId>',
              );
            } else {
              detectedScenario = 'no_agents_init_required';
              throw new Error(
                'No active agents found. Use "init" command to create a new agent first.',
              );
            }
          }

          return this.performReinitializeWithScenario(
            targetAgentId,
            config,
            detectedScenario,
            guide,
          );
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-reinit'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-reinit'),
      };
    }
  }

  /**
   * Internal helper to perform reinitialization with scenario context
   */
  async performReinitializeWithScenario(
    agentId,
    config,
    scenario,
    guide,
    additionalInfo = {},
  ) {
    try {
      // Perform the actual reinitialization
      await this.agentManager.renewAgent(agentId, config);
      const agent = await this.agentManager.getAgent(agentId);

      // Track usage for analytics (non-blocking)
      this.usageTracker.trackCall('reinitialize', agentId, agent.sessionId)
        .catch(error => {
          // Log but don't fail the reinitialize process
          console.warn(`Usage tracking failed for reinitialize: ${error.message}`);
        });

      const response = {
        success: true,
        agentId: agentId,
        agent: agent,
        renewed: true,
        scenario: scenario,
        message: 'Agent reinitialized successfully - heartbeat renewed and timeout reset',
        ...additionalInfo,
      };

      return response;
    } catch (error) {
      throw new Error(`Reinitialization failed: ${error.message}`);
    }
  }

  /**
   * List all active agents in the system
   */
  async listAgents() {
    // Get guide information for all responses (both success and error)
    let guide = null;
    try {
      guide = await this.getGuideForError('agent-lifecycle');
    } catch {
      // If guide fails, continue with operation without guide
    }

    try {
      const result = await this.withTimeout(
        (async () => {
          const agents = await this.agentManager.listActiveAgents();

          return {
            success: true,
            agents: agents,
            count: agents.length,
            message: agents.length > 0
              ? `Found ${agents.length} active agent(s)`
              : 'No active agents found',
          };
        })(),
      );

      // Add guide to success response
      return {
        ...result,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        guide: guide || this.getFallbackGuide('agent-lifecycle'),
      };
    }
  }

  /**
   * Validate agent scope for task operations
   */
  async validateAgentScope(task, agentId) {
    // Check if the task has scope restrictions
    if (!task.scope_restrictions || task.scope_restrictions.length === 0) {
      return {
        isValid: true,
        message: 'No scope restrictions on task',
      };
    }

    // Get agent information
    const agent = await this.agentManager.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found for scope validation`);
    }

    // Validate agent capabilities against task requirements
    const hasRequiredCapabilities = task.scope_restrictions.every(restriction => {
      return agent.capabilities.includes(restriction) ||
             agent.capabilities.includes('*') || // Wildcard capability
             restriction.startsWith('file:') || // File-level restrictions are generally allowed
             restriction.startsWith('dir:');    // Directory-level restrictions are generally allowed
    });

    if (!hasRequiredCapabilities) {
      throw new Error(
        `Agent ${agentId} lacks required capabilities for task ${task.id}. ` +
        `Required: ${task.scope_restrictions.join(', ')}. ` +
        `Agent has: ${agent.capabilities.join(', ')}`,
      );
    }

    return {
      isValid: true,
      message: 'Agent has required capabilities for task scope',
    };
  }
}

module.exports = AgentManagement;

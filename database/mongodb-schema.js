// ============================================================================
// TASKMANAGER MONGODB SCHEMA
// ============================================================================
//
// MongoDB/NoSQL schema design for the TaskManager system
// This provides a flexible, document-based alternative to the SQL schema
//
// Collections: projects, agents, tasks, task_history, agent_sessions
// ============================================================================

// ============================================================================
// COLLECTION SCHEMAS (using Mongoose-style definitions)
// ============================================================================

// Schema definitions for documentation purposes
// In a real MongoDB implementation, these would be used with Mongoose or similar ODM

const _projectSchema = {
  _id: "string", // Custom project ID
  name: "string",
  description: "string",
  rootPath: "string",
  createdAt: "date",
  updatedAt: "date",
  settings: "object",
  isActive: "boolean"
};

const _agentSchema = {
  _id: "string", // Custom agent ID
  projectId: "string",
  role: "string",
  sessionId: "string",
  specialization: "array",
  config: "object",
  createdAt: "date",
  lastHeartbeat: "date",
  isActive: "boolean",
  statistics: {
    totalTasksCompleted: "number",
    avgCompletionTimeMinutes: "number",
    totalWorkTimeMinutes: "number",
    successRate: "number"
  },
  performance: {
    currentStreak: "number",
    longestStreak: "number",
    averageTasksPerDay: "number"
  }
};

const _taskSchema = {
  _id: "string", // Custom task ID
  projectId: "string",
  title: "string",
  description: "string",
  category: "string",
  priority: "string",
  mode: "string",
  status: "string",
  
  // Assignment and ownership
  assignedAgent: "string",
  claimedBy: "string",
  
  // Timing
  createdAt: "date",
  startedAt: "date",
  completedAt: "date",
  revertedAt: "date",
  
  // Task metadata
  estimateMinutes: "number",
  requiresResearch: "boolean",
  successCriteria: "array",
  subtasks: "array",
  importantFiles: "array",
  
  // Dependencies (embedded for performance)
  dependencies: [
    {
      taskId: "string",
      type: "string", // "blocks", "requires", "relates_to"
      status: "string" // "pending", "satisfied", "failed"
    }
  ],
  
  // Progress tracking
  completionPercentage: "number",
  revertReason: "string",
  
  // Performance tracking
  actualTimeMinutes: "number",
  complexityScore: "number",
  
  // Parallel execution support
  parallelExecution: {
    canParallelize: "boolean",
    parallelGroup: "string",
    coordinatorTask: "string",
    parallelAgents: "array"
  },
  
  // Agent assignment history (embedded)
  agentAssignmentHistory: [
    {
      agentId: "string",
      action: "string", // "claimed", "completed", "reverted", "transferred"
      timestamp: "date",
      reason: "string",
      metadata: "object"
    }
  ],
  
  // Audit fields
  createdBy: "string",
  updatedAt: "date",
  version: "number" // Optimistic locking
};

const _taskHistorySchema = {
  _id: "objectId", // Auto-generated
  taskId: "string",
  agentId: "string",
  action: "string",
  previousState: "object",
  newState: "object",
  notes: "string",
  metadata: "object",
  timestamp: "date",
  sessionId: "string"
};

const _agentSessionSchema = {
  _id: "objectId", // Auto-generated
  agentId: "string",
  projectId: "string",
  sessionStart: "date",
  sessionEnd: "date",
  tasksCompleted: "number",
  totalActiveTimeMinutes: "number",
  sessionType: "string",
  heartbeats: [
    {
      timestamp: "date",
      currentTask: "string",
      status: "string",
      systemMetrics: {
        cpuUsage: "number",
        memoryUsage: "number",
        diskSpace: "number"
      },
      activityType: "string",
      metadata: "object"
    }
  ],
  statistics: {
    averageTaskCompletionTime: "number",
    tasksPerHour: "number",
    peakProductivityTime: "string",
    errorRate: "number"
  }
};

// ============================================================================
// MONGODB INDEXES
// ============================================================================

// The following are MongoDB shell commands for creating indexes
// In a Node.js application, these would be executed through a MongoDB driver

/* eslint-disable no-undef */
// Projects collection indexes
db.projects.createIndex({ "isActive": 1 });
db.projects.createIndex({ "rootPath": 1 }, { unique: true });

// Agents collection indexes  
db.agents.createIndex({ "projectId": 1, "isActive": 1 });
db.agents.createIndex({ "lastHeartbeat": 1 });
db.agents.createIndex({ "role": 1 });
db.agents.createIndex({ "sessionId": 1 });

// Tasks collection indexes (critical for performance)
db.tasks.createIndex({ "projectId": 1, "status": 1 });
db.tasks.createIndex({ "assignedAgent": 1 });
db.tasks.createIndex({ "category": 1, "priority": 1 });
db.tasks.createIndex({ "status": 1, "startedAt": 1 });
db.tasks.createIndex({ "createdAt": 1 });
db.tasks.createIndex({ "dependencies.taskId": 1 });
db.tasks.createIndex({ "parallelExecution.parallelGroup": 1 });

// Compound indexes for common queries
db.tasks.createIndex({ "projectId": 1, "status": 1, "category": 1 });
db.tasks.createIndex({ "assignedAgent": 1, "status": 1 });

// Task history indexes
db.task_history.createIndex({ "taskId": 1, "timestamp": 1 });
db.task_history.createIndex({ "agentId": 1, "timestamp": 1 });
db.task_history.createIndex({ "action": 1 });

// Agent sessions indexes
db.agent_sessions.createIndex({ "agentId": 1, "sessionStart": 1 });
db.agent_sessions.createIndex({ "projectId": 1, "sessionStart": 1 });
db.agent_sessions.createIndex({ "sessionStart": 1, "sessionEnd": 1 });

// ============================================================================
// MONGODB AGGREGATION PIPELINES
// ============================================================================

// Get next pending task with dependency resolution
const getNextPendingTaskPipeline = [
  {
    $match: {
      projectId: "PROJECT_ID",
      status: "pending"
    }
  },
  {
    $lookup: {
      from: "tasks",
      let: { taskDeps: "$dependencies.taskId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $in: ["$_id", "$$taskDeps"] },
                { $ne: ["$status", "completed"] }
              ]
            }
          }
        }
      ],
      as: "blockingDependencies"
    }
  },
  {
    $match: {
      blockingDependencies: { $size: 0 }
    }
  },
  {
    $addFields: {
      categoryPriority: {
        $switch: {
          branches: [
            { case: { $eq: ["$category", "linter-error"] }, then: 1 },
            { case: { $eq: ["$category", "build-error"] }, then: 2 },
            { case: { $eq: ["$category", "start-error"] }, then: 3 },
            { case: { $eq: ["$category", "error"] }, then: 4 },
            { case: { $eq: ["$category", "missing-feature"] }, then: 5 },
            { case: { $eq: ["$category", "bug"] }, then: 6 },
            { case: { $eq: ["$category", "enhancement"] }, then: 7 },
            { case: { $eq: ["$category", "refactor"] }, then: 8 },
            { case: { $eq: ["$category", "documentation"] }, then: 9 },
            { case: { $eq: ["$category", "chore"] }, then: 10 },
            { case: { $eq: ["$category", "research"] }, then: 11 }
          ],
          default: 12
        }
      },
      priorityWeight: {
        $switch: {
          branches: [
            { case: { $eq: ["$priority", "critical"] }, then: 1 },
            { case: { $eq: ["$priority", "high"] }, then: 2 },
            { case: { $eq: ["$priority", "medium"] }, then: 3 },
            { case: { $eq: ["$priority", "low"] }, then: 4 }
          ],
          default: 5
        }
      }
    }
  },
  {
    $sort: {
      categoryPriority: 1,
      priorityWeight: 1,
      createdAt: 1
    }
  },
  {
    $limit: 1
  }
];

// Task statistics by category
const taskStatsByCategoryPipeline = [
  {
    $match: {
      projectId: "PROJECT_ID"
    }
  },
  {
    $group: {
      _id: "$category",
      totalTasks: { $sum: 1 },
      pendingTasks: {
        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
      },
      inProgressTasks: {
        $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
      },
      completedTasks: {
        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
      },
      blockedTasks: {
        $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] }
      },
      avgCompletionTime: { $avg: "$actualTimeMinutes" },
      avgComplexity: { $avg: "$complexityScore" }
    }
  },
  {
    $sort: { totalTasks: -1 }
  }
];

// Agent performance analytics
const agentPerformancePipeline = [
  {
    $match: {
      projectId: "PROJECT_ID",
      isActive: true
    }
  },
  {
    $lookup: {
      from: "tasks",
      localField: "_id",
      foreignField: "assignedAgent",
      as: "assignedTasks"
    }
  },
  {
    $addFields: {
      totalTasksAssigned: { $size: "$assignedTasks" },
      completedTasks: {
        $size: {
          $filter: {
            input: "$assignedTasks",
            cond: { $eq: ["$$this.status", "completed"] }
          }
        }
      },
      inProgressTasks: {
        $size: {
          $filter: {
            input: "$assignedTasks",
            cond: { $eq: ["$$this.status", "in_progress"] }
          }
        }
      },
      avgTaskCompletionTime: {
        $avg: {
          $map: {
            input: {
              $filter: {
                input: "$assignedTasks",
                cond: { $eq: ["$$this.status", "completed"] }
              }
            },
            in: "$$this.actualTimeMinutes"
          }
        }
      },
      successRate: {
        $cond: [
          { $eq: ["$totalTasksAssigned", 0] },
          0,
          {
            $multiply: [
              { $divide: ["$completedTasks", "$totalTasksAssigned"] },
              100
            ]
          }
        ]
      }
    }
  },
  {
    $project: {
      _id: 1,
      role: 1,
      specialization: 1,
      lastHeartbeat: 1,
      totalTasksAssigned: 1,
      completedTasks: 1,
      inProgressTasks: 1,
      avgTaskCompletionTime: 1,
      successRate: 1,
      isCurrentlyActive: {
        $gte: [
          "$lastHeartbeat",
          { $subtract: [new Date(), 15 * 60 * 1000] } // 15 minutes ago
        ]
      }
    }
  }
];

// Real-time project dashboard
const projectDashboardPipeline = [
  {
    $match: {
      _id: "PROJECT_ID"
    }
  },
  {
    $lookup: {
      from: "tasks",
      localField: "_id",
      foreignField: "projectId",
      as: "tasks"
    }
  },
  {
    $lookup: {
      from: "agents",
      localField: "_id",
      foreignField: "projectId",
      as: "agents"
    }
  },
  {
    $addFields: {
      taskSummary: {
        total: { $size: "$tasks" },
        pending: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "pending"] }
            }
          }
        },
        inProgress: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "in_progress"] }
            }
          }
        },
        completed: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "completed"] }
            }
          }
        },
        blocked: {
          $size: {
            $filter: {
              input: "$tasks",
              cond: { $eq: ["$$this.status", "blocked"] }
            }
          }
        }
      },
      agentSummary: {
        total: { $size: "$agents" },
        active: {
          $size: {
            $filter: {
              input: "$agents",
              cond: {
                $gte: [
                  "$$this.lastHeartbeat",
                  { $subtract: [new Date(), 15 * 60 * 1000] }
                ]
              }
            }
          }
        }
      }
    }
  },
  {
    $project: {
      name: 1,
      description: 1,
      rootPath: 1,
      isActive: 1,
      taskSummary: 1,
      agentSummary: 1,
      updatedAt: 1
    }
  }
];

// ============================================================================
// MONGODB JAVASCRIPT FUNCTIONS
// ============================================================================

// Function to claim a task (atomic operation)
function claimTask(taskId, agentId) {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction();
    
    // Check if task is available
    const task = db.tasks.findOne(
      { 
        _id: taskId, 
        status: "pending", 
        assignedAgent: null 
      },
      { session }
    );
    
    if (!task) {
      throw new Error("Task not available for claiming");
    }
    
    // Claim the task
    const updateResult = db.tasks.updateOne(
      { _id: taskId, status: "pending", assignedAgent: null },
      {
        $set: {
          assignedAgent: agentId,
          claimedBy: agentId,
          status: "in_progress",
          startedAt: new Date(),
          updatedAt: new Date()
        },
        $push: {
          agentAssignmentHistory: {
            agentId: agentId,
            action: "claimed",
            timestamp: new Date(),
            reason: "Task claimed by agent"
          }
        },
        $inc: { version: 1 }
      },
      { session }
    );
    
    if (updateResult.modifiedCount === 0) {
      throw new Error("Failed to claim task - may have been claimed by another agent");
    }
    
    // Update agent heartbeat
    db.agents.updateOne(
      { _id: agentId },
      { 
        $set: { lastHeartbeat: new Date() }
      },
      { session }
    );
    
    // Log the action
    db.task_history.insertOne({
      taskId: taskId,
      agentId: agentId,
      action: "claimed",
      previousState: { status: "pending" },
      newState: { status: "in_progress", assignedAgent: agentId },
      notes: "Task claimed by agent",
      metadata: {},
      timestamp: new Date()
    }, { session });
    
    session.commitTransaction();
    return { success: true, taskId: taskId, agentId: agentId };
    
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Function to update task status
function updateTaskStatus(taskId, newStatus, agentId, notes = "") {
  const session = db.getMongo().startSession();
  
  try {
    session.startTransaction();
    
    const task = db.tasks.findOne({ _id: taskId }, { session });
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updateFields = {
      status: newStatus,
      updatedAt: new Date()
    };
    
    // Set completion time if task is being completed
    if (newStatus === "completed" && task.status === "in_progress") {
      const completionTime = Math.round(
        (new Date() - task.startedAt) / (1000 * 60)
      );
      updateFields.completedAt = new Date();
      updateFields.actualTimeMinutes = completionTime;
    }
    
    // Update task
    db.tasks.updateOne(
      { _id: taskId },
      {
        $set: updateFields,
        $push: {
          agentAssignmentHistory: {
            agentId: agentId,
            action: "status_update",
            timestamp: new Date(),
            reason: `Status changed to ${newStatus}: ${notes}`
          }
        },
        $inc: { version: 1 }
      },
      { session }
    );
    
    // Log the action
    db.task_history.insertOne({
      taskId: taskId,
      agentId: agentId,
      action: "status_update",
      previousState: { status: task.status },
      newState: { status: newStatus },
      notes: notes,
      metadata: {},
      timestamp: new Date()
    }, { session });
    
    // Update agent statistics if task completed
    if (newStatus === "completed") {
      const completedTasks = db.tasks.countDocuments({
        assignedAgent: agentId,
        status: "completed"
      }, { session });
      
      const avgTime = db.tasks.aggregate([
        { $match: { assignedAgent: agentId, status: "completed" } },
        { $group: { _id: null, avg: { $avg: "$actualTimeMinutes" } } }
      ], { session }).toArray()[0];
      
      db.agents.updateOne(
        { _id: agentId },
        {
          $set: {
            "statistics.totalTasksCompleted": completedTasks,
            "statistics.avgCompletionTimeMinutes": avgTime ? avgTime.avg : 0,
            lastHeartbeat: new Date()
          }
        },
        { session }
      );
    }
    
    session.commitTransaction();
    return { success: true, taskId: taskId, newStatus: newStatus };
    
  } catch (error) {
    session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// ============================================================================
// COLLECTION VALIDATION RULES
// ============================================================================

// Tasks collection validation
db.createCollection("tasks", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "projectId", "title", "category", "status"],
      properties: {
        _id: { bsonType: "string" },
        projectId: { bsonType: "string" },
        title: { bsonType: "string", minLength: 1, maxLength: 500 },
        category: { 
          bsonType: "string",
          enum: ["linter-error", "build-error", "start-error", "error", 
                 "missing-feature", "bug", "enhancement", "refactor", 
                 "documentation", "chore", "research", "missing-test"]
        },
        status: {
          bsonType: "string",
          enum: ["pending", "in_progress", "completed", "blocked"]
        },
        priority: {
          bsonType: "string",
          enum: ["critical", "high", "medium", "low"]
        },
        completionPercentage: {
          bsonType: "number",
          minimum: 0,
          maximum: 100
        },
        complexityScore: {
          bsonType: "number",
          minimum: 1,
          maximum: 10
        }
      }
    }
  }
});

// Agents collection validation
db.createCollection("agents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "projectId", "role"],
      properties: {
        _id: { bsonType: "string" },
        projectId: { bsonType: "string" },
        role: { bsonType: "string" },
        isActive: { bsonType: "bool" },
        lastHeartbeat: { bsonType: "date" },
        specialization: { bsonType: "array" }
      }
    }
  }
});

// ============================================================================
// SAMPLE DATA FOR TESTING
// ============================================================================

// Insert sample project
db.projects.insertOne({
  _id: "infinite-continue-stop-hook",
  name: "Infinite Continue Stop Hook",
  description: "TaskManager automation system for Claude Code",
  rootPath: "/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook",
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {},
  isActive: true
});

// ============================================================================
// MAINTENANCE AND OPTIMIZATION
// ============================================================================

// Auto-cleanup old heartbeats (run daily)
function cleanupOldHeartbeats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  db.agent_sessions.updateMany(
    {},
    {
      $pull: {
        heartbeats: {
          timestamp: { $lt: sevenDaysAgo }
        }
      }
    }
  );
}

// Archive completed tasks older than 30 days
function archiveOldTasks() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const oldTasks = db.tasks.find({
    status: "completed",
    completedAt: { $lt: thirtyDaysAgo }
  });
  
  // Move to archive collection
  db.archived_tasks.insertMany(oldTasks.toArray());
  
  // Remove from main collection
  db.tasks.deleteMany({
    status: "completed",
    completedAt: { $lt: thirtyDaysAgo }
  });
}

// ============================================================================
// MONGODB CHANGE STREAMS (Real-time updates)
// ============================================================================

// Watch for task status changes (example - would be used in Node.js application)
// const taskChangeStream = db.tasks.watch([
//   {
//     $match: {
//       "operationType": "update",
//       "updateDescription.updatedFields.status": { $exists: true }
//     }
//   }
// ]);

// Watch for new agent registrations (example - would be used in Node.js application)
// const agentChangeStream = db.agents.watch([
//   {
//     $match: {
//       "operationType": "insert"
//     }
//   }
// ]);

// ============================================================================
// EXPORT FUNCTIONS FOR NODE.JS INTEGRATION
// ============================================================================

module.exports = {
  getNextPendingTaskPipeline,
  taskStatsByCategoryPipeline,
  agentPerformancePipeline,
  projectDashboardPipeline,
  claimTask,
  updateTaskStatus,
  cleanupOldHeartbeats,
  archiveOldTasks
};

/* eslint-enable no-undef */
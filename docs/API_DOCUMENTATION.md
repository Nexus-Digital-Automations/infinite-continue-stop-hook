# TaskManager REST API Documentation

## Overview

The TaskManager REST API provides HTTP endpoints for managing tasks, agents, and system operations. It integrates with the existing TaskManager, Agent Registry, and stop-hook systems.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Response Format

All responses follow this standard format:

```json
{
  "success": true|false,
  "data": { ... },
  "error": "Error message (if success=false)"
}
```

## Endpoints

### Task Management

#### List Tasks
```http
GET /api/tasks
```

**Query Parameters:**
- `status` - Filter by task status (pending, in_progress, completed, blocked)
- `category` - Filter by task category
- `assigned_agent` - Filter by assigned agent ID
- `limit` - Maximum number of results (default: all)
- `offset` - Starting index for pagination (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/tasks?status=pending&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "total": 50,
      "offset": 0,
      "limit": 10,
      "hasMore": true
    }
  }
}
```

#### Get Task Details
```http
GET /api/tasks/:taskId
```

**Example:**
```bash
curl "http://localhost:3000/api/tasks/task_123456789"
```

#### Create Task
```http
POST /api/tasks
```

**Required Fields:**
- `title` (string)
- `category` (string)

**Optional Fields:**
- `description` (string)
- `priority` (string: low, medium, high, critical)
- `mode` (string: DEVELOPMENT, TESTING, etc.)
- `dependencies` (array of task IDs)
- `important_files` (array of file paths)
- `success_criteria` (array of strings)
- `estimate` (string)
- `requires_research` (boolean)
- `subtasks` (array)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add OAuth 2.0 login system",
    "category": "missing-feature",
    "priority": "high"
  }'
```

#### Update Task Status
```http
PUT /api/tasks/:taskId/status
```

**Required Fields:**
- `status` (string: pending, in_progress, completed, blocked)

**Optional Fields:**
- `notes` (string)
- `agentId` (string)

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/tasks/task_123/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Successfully implemented feature"
  }'
```

#### Claim Task
```http
POST /api/tasks/:taskId/claim
```

**Required Fields:**
- `agentId` (string)

**Optional Fields:**
- `priority` (string: normal, high, critical)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/tasks/task_123/claim" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_456",
    "priority": "high"
  }'
```

### Agent Management

#### List Agents
```http
GET /api/agents
```

**Example:**
```bash
curl "http://localhost:3000/api/agents"
```

#### Register Agent
```http
POST /api/agents/register
```

**Optional Fields:**
- `role` (string: development, testing, etc.)
- `sessionId` (string)
- `specialization` (array of strings)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/agents/register" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "development",
    "specialization": ["frontend", "react"]
  }'
```

#### Get Agent's Current Task
```http
GET /api/agents/:agentId/current-task
```

**Example:**
```bash
curl "http://localhost:3000/api/agents/agent_123/current-task"
```

### System Information

#### Health Check
```http
GET /api/health
```

Returns basic health status and server information.

**Example:**
```bash
curl "http://localhost:3000/api/health"
```

#### System Status
```http
GET /api/status
```

Returns comprehensive system status including task counts and active agents.

**Example:**
```bash
curl "http://localhost:3000/api/status"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "system": {
      "status": "operational",
      "timestamp": "2025-08-19T22:00:00.000Z"
    },
    "tasks": {
      "pending": 18,
      "in_progress": 3,
      "completed": 39,
      "total": 60,
      "hasWork": true
    },
    "agents": {
      "total": 5,
      "active": 2,
      "activeAgentIds": ["agent_123", "agent_456"]
    }
  }
}
```

#### System Statistics
```http
GET /api/stats
```

Returns detailed statistics about tasks, agents, and performance metrics.

**Example:**
```bash
curl "http://localhost:3000/api/stats"
```

### Stop Hook Control

#### Authorize Stop Hook
```http
POST /api/stop-hook/authorize
```

Authorizes a single stop for the infinite continue hook system.

**Required Fields:**
- `agentId` (string)

**Optional Fields:**
- `reason` (string)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/stop-hook/authorize" \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "agent_123",
    "reason": "Maintenance required"
  }'
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include details:

```json
{
  "success": false,
  "error": "Task not found",
  "taskId": "task_123"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. All requests are processed immediately.

## Usage Examples

### Complete Workflow Example

```bash
# 1. Check system status
curl "http://localhost:3000/api/status"

# 2. List pending tasks
curl "http://localhost:3000/api/tasks?status=pending&limit=5"

# 3. Register as an agent
curl -X POST "http://localhost:3000/api/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"role": "development"}'

# 4. Claim a task
curl -X POST "http://localhost:3000/api/tasks/task_123/claim" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "your_agent_id"}'

# 5. Update task status when complete
curl -X PUT "http://localhost:3000/api/tasks/task_123/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "notes": "Task completed successfully"}'
```

### Integration with TaskManager CLI

The REST API complements the existing TaskManager CLI tools:

```bash
# CLI approach
node taskmanager-api.js current

# REST API approach
curl "http://localhost:3000/api/agents/your_agent_id/current-task"
```

## Starting the Server

```bash
# Production
npm start

# Development
npm run dev

# Custom port
PORT=8080 npm start
```

The server will start on port 3000 by default, or the port specified in the `PORT` environment variable.

## Integration Notes

- The API integrates with existing TODO.json and agent-registry.json files
- All operations respect the TaskManager's dependency system
- Task categories and priorities follow existing conventions
- Agent heartbeat tracking is maintained for active agent detection
- Stop hook authorization works with the infinite continue system
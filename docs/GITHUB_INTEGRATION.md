# GitHub Integration for TaskManager

This document describes the comprehensive GitHub API integration for the TaskManager system, enabling seamless synchronization between tasks and GitHub issues, repository analytics, and webhook processing.

## 🚀 Features

### Core Integration Features
- **📋 Task-to-Issue Sync**: Convert TaskManager tasks into GitHub issues
- **🔄 Bidirectional Updates**: Sync status changes between tasks and issues
- **📊 Repository Analytics**: Detailed repository statistics and insights
- **🎣 Webhook Processing**: Automated task creation from GitHub events
- **🏷️ Smart Labeling**: Automatic label assignment based on task properties
- **🔐 Secure Authentication**: GitHub token-based authentication with signature verification

### API Endpoints
- **Connection Testing**: `/api/github/status`
- **Repository Info**: `/api/github/repository`
- **Analytics Dashboard**: `/api/github/analytics`
- **Issue Management**: `/api/github/issues`
- **Task Synchronization**: `/api/github/sync-task/:taskId`
- **Webhook Handler**: `/api/github/webhook`

## 📦 Components

### 1. GitHubApiService (`lib/githubApiService.js`)
Core service class providing GitHub API functionality:

```javascript
const GitHubApiService = require('./lib/githubApiService');

const githubService = new GitHubApiService({
  token: process.env.GITHUB_TOKEN,
  repository: {
    owner: 'anthropics',
    name: 'infinite-continue-stop-hook'
  },
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET
});

// Test connection
const status = await githubService.testConnection();

// Get repository information
const repoInfo = await githubService.getRepositoryInfo();

// Create issue from task
const result = await githubService.createIssueFromTask(task);
```

### 2. GitHub CLI Tool (`github-cli.js`)
Command-line interface for GitHub operations:

```bash
# Test API connection
node github-cli.js status

# Show repository information
node github-cli.js repository

# Display analytics
node github-cli.js analytics

# List issues
node github-cli.js issues open

# Sync specific task
node github-cli.js sync-task task_12345

# Sync all pending tasks
node github-cli.js sync-all

# Test webhook processing
node github-cli.js webhook-test
```

### 3. API Server Integration
REST endpoints integrated into the main API server:

```javascript
// GET /api/github/status - Connection status
// GET /api/github/repository - Repository information
// GET /api/github/analytics - Analytics dashboard
// GET /api/github/issues - List issues
// POST /api/github/sync-task/:taskId - Create issue from task
// PUT /api/github/sync-task/:taskId/:issueNumber - Update issue
// POST /api/github/webhook - Webhook endpoint
```

## 🔧 Setup and Configuration

### Environment Variables

```bash
# Required for authenticated requests
export GITHUB_TOKEN="ghp_your_personal_access_token"

# Optional repository configuration
export GITHUB_REPO_OWNER="your-username"
export GITHUB_REPO_NAME="your-repository"

# Optional webhook security
export GITHUB_WEBHOOK_SECRET="your_webhook_secret"
```

### GitHub Token Setup

1. **Create Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with these scopes:
     - `repo` - Full repository access
     - `issues` - Read and write issues
     - `pull_requests` - Read and write pull requests

2. **Set Environment Variable**:
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

### Webhook Configuration

1. **Repository Webhook Setup**:
   - Go to repository Settings → Webhooks
   - Add webhook with URL: `https://your-server.com/api/github/webhook`
   - Content type: `application/json`
   - Events: `Issues`, `Pull requests`

2. **Secret Configuration**:
   ```bash
   export GITHUB_WEBHOOK_SECRET="your_secure_secret"
   ```

## 📊 Usage Examples

### Basic Operations

```bash
# Test GitHub connection
curl http://localhost:3000/api/github/status

# Get repository information
curl http://localhost:3000/api/github/repository

# List open issues
curl "http://localhost:3000/api/github/issues?state=open&per_page=5"

# Get repository analytics
curl http://localhost:3000/api/github/analytics
```

### Task Synchronization

```bash
# Create GitHub issue from task
curl -X POST http://localhost:3000/api/github/sync-task/task_12345

# Update GitHub issue from task
curl -X PUT http://localhost:3000/api/github/sync-task/task_12345/42
```

### CLI Operations

```bash
# Quick status check
./github-cli.js status

# Repository overview
./github-cli.js repository

# Detailed analytics
./github-cli.js analytics

# Issue management
./github-cli.js issues closed
./github-cli.js sync-task task_abc123
```

## 🎯 Task-to-Issue Mapping

### Task Properties → GitHub Issue

| TaskManager Property | GitHub Issue Field | Notes |
|---------------------|-------------------|-------|
| `title` | `title` | Direct mapping |
| `description` | `body` | Formatted with metadata |
| `category` | `labels` | Added as `category:value` |
| `priority` | `labels` | Added as `priority:value` |
| `status` | `state` | `completed` → `closed` |
| `assigned_agent` | `assignees` | If valid GitHub username |
| `dependencies` | `body` | Listed in description |
| `created_at` | `body` | Included in metadata |

### Automatic Label Generation

Tasks automatically generate GitHub labels:
- `taskmanager` - Identifies TaskManager-synced issues
- `category:bug` - Task category
- `priority:high` - Task priority
- `status:in_progress` - Current status
- `mode:development` - Task mode

### Example Issue Body

```markdown
**TaskManager Task**: task_1755624441094_z7zru65tg

Implement external API integration based on research findings

**Task Details:**
- **Category**: missing-feature
- **Priority**: high
- **Status**: in_progress
- **Mode**: DEVELOPMENT
- **Assigned Agent**: development_agent_1

**Created**: 2025-08-19T17:27:21.094Z

---
*Synchronized from TaskManager System*
```

## 📈 Analytics Features

### Repository Metrics
- **Issue Statistics**: Total, open, closed, closure rate
- **Collaboration Data**: Contributors count
- **Activity Timeline**: Recent updates and issues
- **Performance Tracking**: Issue resolution trends

### TaskManager Integration Metrics
- **Sync Status**: Successfully synced tasks
- **Issue Mapping**: Task-to-issue relationships
- **Activity Correlation**: GitHub vs TaskManager activity

### Example Analytics Output

```json
{
  "repository": {
    "name": "infinite-continue-stop-hook",
    "stars": 42,
    "forks": 15,
    "issues": 8
  },
  "issues": {
    "total": 25,
    "open": 8,
    "closed": 17,
    "closureRate": "68.0%"
  },
  "contributors": 5,
  "activity": {
    "lastUpdate": "2025-08-19T22:47:55.000Z",
    "recentIssues": [...]
  }
}
```

## 🎣 Webhook Processing

### Supported Events
- **Issues**: `opened`, `closed`, `edited`, `assigned`
- **Pull Requests**: `opened`, `closed`, `merged`

### Automatic Task Suggestions

When GitHub issues are created or updated, the system suggests TaskManager tasks:

```javascript
// Issue opened → Suggest task creation
{
  "type": "create_task",
  "title": "GitHub Issue: Fix critical bug",
  "description": "Created from GitHub issue #123",
  "category": "bug",
  "priority": "high"
}

// Issue closed → Suggest task completion
{
  "type": "update_task",
  "action": "complete",
  "reason": "GitHub issue #123 was closed"
}
```

### Webhook Signature Verification

```javascript
// Automatic signature verification
const isValid = githubService.verifyWebhookSignature(payload, signature);

// Secure webhook processing
app.post('/api/github/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!githubService.verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  // Process webhook...
});
```

## 🔒 Security Features

### Authentication
- **Personal Access Tokens**: Secure GitHub API access
- **Rate Limiting**: Automatic rate limit detection and handling
- **Request Timeouts**: Configurable timeout protection

### Webhook Security
- **Signature Verification**: HMAC-SHA256 signature validation
- **Secret Management**: Environment-based secret configuration
- **Event Filtering**: Process only relevant webhook events

### Data Protection
- **No Token Storage**: Tokens read from environment only
- **Minimal Permissions**: Request only necessary GitHub scopes
- **Error Sanitization**: Sensitive data excluded from error messages

## 🚀 Advanced Features

### Batch Operations
```bash
# Sync multiple tasks efficiently
./github-cli.js sync-all
```

### Custom Repository Configuration
```javascript
const githubService = new GitHubApiService({
  repository: {
    owner: 'custom-org',
    name: 'custom-repo'
  },
  timeout: 15000,
  userAgent: 'Custom-TaskManager/2.0.0'
});
```

### Integration with TaskManager API
```javascript
// Automatic issue creation on task creation
taskManager.on('task:created', async (task) => {
  if (shouldSyncToGitHub(task)) {
    await githubService.createIssueFromTask(task);
  }
});
```

## 📋 Best Practices

### Performance Optimization
- **Rate Limit Awareness**: Monitor and respect GitHub rate limits
- **Batch Processing**: Group operations to reduce API calls
- **Caching**: Cache repository information for repeated requests
- **Async Operations**: Use non-blocking operations for better performance

### Error Handling
- **Graceful Degradation**: Continue operation if GitHub is unavailable
- **Retry Logic**: Implement exponential backoff for failed requests
- **Comprehensive Logging**: Log all GitHub interactions for debugging
- **User Feedback**: Provide clear error messages and suggestions

### Integration Patterns
- **Event-Driven Sync**: Use webhooks for real-time synchronization
- **Selective Sync**: Only sync relevant tasks based on category/priority
- **Conflict Resolution**: Handle conflicts between GitHub and TaskManager state
- **Audit Trail**: Maintain history of all sync operations

## 🔧 Troubleshooting

### Common Issues

**Authentication Errors**
```bash
# Check token validity
./github-cli.js status

# Verify token scopes in GitHub settings
```

**Rate Limiting**
```bash
# Monitor rate limits
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/rate_limit
```

**Webhook Failures**
```bash
# Test webhook processing locally
./github-cli.js webhook-test

# Check webhook delivery logs in GitHub
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=github:* node github-cli.js status

# Test with specific repository
GITHUB_REPO_OWNER=octocat GITHUB_REPO_NAME=Hello-World \
  node github-cli.js repository
```

## 📚 API Reference

### GitHubApiService Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `testConnection()` | Test API connectivity | None | `{success, authenticated, rateLimit}` |
| `getRepositoryInfo()` | Get repository details | None | `{success, repository}` |
| `createIssueFromTask(task)` | Create GitHub issue | `task` object | `{success, issue}` |
| `updateIssueFromTask(issueNumber, task)` | Update issue | `issueNumber`, `task` | `{success, issue}` |
| `getIssues(options)` | List repository issues | `{state, labels, sort, ...}` | `{success, issues, pagination}` |
| `processWebhookEvent(event)` | Process webhook | `event` object | `{success, event, suggestions}` |
| `verifyWebhookSignature(payload, signature)` | Verify signature | `payload`, `signature` | `boolean` |

### CLI Commands

| Command | Description | Parameters | Example |
|---------|-------------|------------|---------|
| `status` | Test connection | None | `./github-cli.js status` |
| `repository` | Show repo info | None | `./github-cli.js repository` |
| `analytics` | Display analytics | None | `./github-cli.js analytics` |
| `issues` | List issues | `[state]` | `./github-cli.js issues open` |
| `sync-task` | Sync specific task | `<taskId>` | `./github-cli.js sync-task task_123` |
| `sync-all` | Sync all tasks | None | `./github-cli.js sync-all` |
| `webhook-test` | Test webhooks | None | `./github-cli.js webhook-test` |

This comprehensive GitHub integration transforms the TaskManager system into a fully connected development workflow tool, bridging the gap between task management and collaborative software development on GitHub.
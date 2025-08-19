#!/usr/bin/env node

/**
 * GitHub Integration CLI for TaskManager
 * 
 * Command-line interface for managing GitHub integration features including
 * issue synchronization, repository analytics, and webhook management.
 */

const GitHubApiService = require('./lib/githubApiService');
const TaskManager = require('./lib/taskManager');
const path = require('path');

class GitHubCLI {
  constructor() {
    this.githubService = new GitHubApiService();
    this.taskManager = new TaskManager(path.join(process.cwd(), 'TODO.json'));
  }

  /**
   * Display help information
   */
  showHelp() {
    console.log(`
🐙 GitHub Integration CLI for TaskManager

USAGE:
  node github-cli.js <command> [options]

COMMANDS:
  status              - Test GitHub API connection
  repository          - Show repository information
  analytics           - Display repository analytics
  issues [state]      - List GitHub issues (state: open, closed, all)
  sync-task <taskId>  - Create GitHub issue from task
  sync-all            - Sync all pending tasks to GitHub
  webhook-test        - Test webhook processing
  help                - Show this help message

EXAMPLES:
  node github-cli.js status
  node github-cli.js repository
  node github-cli.js issues open
  node github-cli.js sync-task task_12345
  node github-cli.js analytics

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN        - GitHub personal access token
  GITHUB_REPO_OWNER   - Repository owner (default: anthropics)
  GITHUB_REPO_NAME    - Repository name (default: infinite-continue-stop-hook)
  GITHUB_WEBHOOK_SECRET - Webhook secret for signature verification

For more information, visit: https://docs.github.com/en/rest
`);
  }

  /**
   * Test GitHub API connection
   */
  async testConnection() {
    console.log('🔍 Testing GitHub API connection...\n');
    
    const result = await this.githubService.testConnection();
    
    if (result.success) {
      console.log('✅ GitHub API Connection Successful');
      console.log(`   Authentication: ${result.authenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
      
      if (result.rateLimit) {
        console.log(`   Rate Limit: ${result.rateLimit.remaining}/${result.rateLimit.limit} requests remaining`);
        console.log(`   Reset Time: ${new Date(result.rateLimit.reset * 1000).toLocaleString()}`);
      }
      
      console.log(`   Message: ${result.message}`);
    } else {
      console.log('❌ GitHub API Connection Failed');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
      
      if (!process.env.GITHUB_TOKEN) {
        console.log('\n💡 TIP: Set GITHUB_TOKEN environment variable for authenticated requests');
      }
    }
  }

  /**
   * Show repository information
   */
  async showRepository() {
    console.log('📊 Fetching repository information...\n');
    
    const result = await this.githubService.getRepositoryInfo();
    
    if (result.success) {
      const repo = result.repository;
      console.log('✅ Repository Information');
      console.log(`   Name: ${repo.name}`);
      console.log(`   Full Name: ${repo.fullName}`);
      console.log(`   Description: ${repo.description || 'No description'}`);
      console.log(`   URL: ${repo.url}`);
      console.log(`   Language: ${repo.language || 'Not specified'}`);
      console.log(`   Stars: ${repo.stars}`);
      console.log(`   Forks: ${repo.forks}`);
      console.log(`   Open Issues: ${repo.issues}`);
      console.log(`   Default Branch: ${repo.defaultBranch}`);
      console.log(`   Created: ${new Date(repo.createdAt).toLocaleDateString()}`);
      console.log(`   Last Updated: ${new Date(repo.updatedAt).toLocaleDateString()}`);
    } else {
      console.log('❌ Failed to get repository information');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
    }
  }

  /**
   * Display repository analytics
   */
  async showAnalytics() {
    console.log('📈 Generating repository analytics...\n');
    
    const result = await this.githubService.getRepositoryAnalytics();
    
    if (result.success) {
      const analytics = result.analytics;
      
      console.log('✅ Repository Analytics');
      console.log('\n📊 Issue Statistics:');
      console.log(`   Total Issues: ${analytics.issues.total}`);
      console.log(`   Open Issues: ${analytics.issues.open}`);
      console.log(`   Closed Issues: ${analytics.issues.closed}`);
      console.log(`   Closure Rate: ${analytics.issues.closureRate}%`);
      
      console.log('\n👥 Collaboration:');
      console.log(`   Contributors: ${analytics.contributors}`);
      
      console.log('\n⚡ Recent Activity:');
      console.log(`   Last Update: ${new Date(analytics.activity.lastUpdate).toLocaleString()}`);
      
      if (analytics.activity.recentIssues.length > 0) {
        console.log('\n📋 Recent Issues:');
        analytics.activity.recentIssues.forEach((issue, i) => {
          const stateIcon = issue.state === 'open' ? '🟢' : '🔴';
          console.log(`   ${i + 1}. ${stateIcon} #${issue.number}: ${issue.title}`);
          console.log(`      Updated: ${new Date(issue.updatedAt).toLocaleDateString()}`);
        });
      }
    } else {
      console.log('❌ Failed to get repository analytics');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
    }
  }

  /**
   * List GitHub issues
   */
  async listIssues(state = 'open') {
    console.log(`🔍 Fetching ${state} GitHub issues...\n`);
    
    const result = await this.githubService.getIssues({ 
      state, 
      perPage: 10,
      sort: 'updated',
      direction: 'desc'
    });
    
    if (result.success) {
      const issues = result.issues;
      
      if (issues.length === 0) {
        console.log(`📭 No ${state} issues found`);
        return;
      }
      
      console.log(`✅ Found ${issues.length} ${state} issues:\n`);
      
      issues.forEach((issue, i) => {
        const stateIcon = issue.state === 'open' ? '🟢' : '🔴';
        const labels = issue.labels.length > 0 ? ` [${issue.labels.join(', ')}]` : '';
        
        console.log(`${i + 1}. ${stateIcon} #${issue.number}: ${issue.title}${labels}`);
        console.log(`   URL: ${issue.url}`);
        console.log(`   Created: ${new Date(issue.createdAt).toLocaleDateString()}`);
        console.log(`   Updated: ${new Date(issue.updatedAt).toLocaleDateString()}`);
        
        if (issue.assignees.length > 0) {
          console.log(`   Assignees: ${issue.assignees.join(', ')}`);
        }
        
        console.log('');
      });
      
      if (result.pagination.hasNext) {
        console.log('📄 Use pagination parameters to see more issues');
      }
    } else {
      console.log('❌ Failed to get GitHub issues');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
    }
  }

  /**
   * Sync a specific task to GitHub
   */
  async syncTask(taskId) {
    if (!taskId) {
      console.log('❌ Task ID required');
      console.log('Usage: node github-cli.js sync-task <taskId>');
      return;
    }

    console.log(`🔄 Syncing task ${taskId} to GitHub...\n`);
    
    // Get task details
    const todoData = await this.taskManager.readTodo();
    const task = (todoData.tasks || []).find(t => t.id === taskId);
    
    if (!task) {
      console.log(`❌ Task ${taskId} not found`);
      return;
    }
    
    console.log(`📋 Task Details:`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Category: ${task.category}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Status: ${task.status}`);
    console.log('');
    
    const result = await this.githubService.createIssueFromTask(task);
    
    if (result.success) {
      console.log('✅ GitHub issue created successfully');
      console.log(`   Issue Number: #${result.issue.number}`);
      console.log(`   Issue URL: ${result.issue.url}`);
      console.log(`   Title: ${result.issue.title}`);
      console.log(`   State: ${result.issue.state}`);
    } else {
      console.log('❌ Failed to create GitHub issue');
      console.log(`   Error: ${result.error}`);
      console.log(`   Message: ${result.message}`);
      
      if (result.error.includes('token')) {
        console.log('\n💡 TIP: Set GITHUB_TOKEN environment variable for issue creation');
      }
    }
  }

  /**
   * Sync all pending tasks to GitHub
   */
  async syncAllTasks() {
    console.log('🔄 Syncing all pending tasks to GitHub...\n');
    
    if (!process.env.GITHUB_TOKEN) {
      console.log('❌ GitHub token required for creating issues');
      console.log('Set GITHUB_TOKEN environment variable and try again');
      return;
    }
    
    const todoData = await this.taskManager.readTodo();
    const pendingTasks = (todoData.tasks || []).filter(t => 
      t.status === 'pending' || t.status === 'in_progress'
    );
    
    if (pendingTasks.length === 0) {
      console.log('📭 No pending tasks to sync');
      return;
    }
    
    console.log(`📋 Found ${pendingTasks.length} tasks to sync`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const task of pendingTasks.slice(0, 5)) { // Limit to first 5 to avoid rate limits
      console.log(`\n🔄 Syncing: ${task.title}`);
      
      const result = await this.githubService.createIssueFromTask(task);
      
      if (result.success) {
        console.log(`   ✅ Created issue #${result.issue.number}`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        failureCount++;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 Sync Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failureCount}`);
    console.log(`   📄 Total: ${successCount + failureCount}`);
    
    if (pendingTasks.length > 5) {
      console.log(`\n💡 Only synced first 5 tasks to avoid rate limits`);
      console.log(`   Run sync-task command for specific tasks`);
    }
  }

  /**
   * Test webhook processing
   */
  async testWebhook() {
    console.log('🧪 Testing webhook processing...\n');
    
    const mockEvent = {
      action: 'opened',
      issue: {
        id: 12345,
        number: 42,
        title: 'Test issue from webhook',
        state: 'open',
        labels: [
          { name: 'bug' },
          { name: 'priority:high' }
        ],
        assignees: [
          { login: 'test-user' }
        ],
        updated_at: new Date().toISOString()
      },
      repository: {
        full_name: 'test/repo',
        html_url: 'https://github.com/test/repo'
      }
    };
    
    const result = this.githubService.processWebhookEvent(mockEvent);
    
    if (result.success) {
      console.log('✅ Webhook processing successful');
      console.log('\n📋 Event Details:');
      console.log(`   Type: ${result.event.type}`);
      console.log(`   Action: ${result.event.action}`);
      console.log(`   Issue: #${result.event.issue.number} - ${result.event.issue.title}`);
      console.log(`   State: ${result.event.issue.state}`);
      console.log(`   Labels: ${result.event.issue.labels.join(', ')}`);
      console.log(`   Repository: ${result.event.repository.name}`);
      
      if (result.suggestions.length > 0) {
        console.log('\n💡 Task Suggestions:');
        result.suggestions.forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion.type}: ${suggestion.title}`);
          console.log(`      Category: ${suggestion.category}, Priority: ${suggestion.priority}`);
        });
      }
    } else {
      console.log('❌ Webhook processing failed');
      console.log(`   Message: ${result.message}`);
    }
  }

  /**
   * Run CLI command
   */
  async run() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command || command === 'help') {
      this.showHelp();
      return;
    }
    
    try {
      switch (command) {
        case 'status':
          await this.testConnection();
          break;
          
        case 'repository':
          await this.showRepository();
          break;
          
        case 'analytics':
          await this.showAnalytics();
          break;
          
        case 'issues': {
          const state = args[1] || 'open';
          await this.listIssues(state);
          break;
        }
          
        case 'sync-task': {
          const taskId = args[1];
          await this.syncTask(taskId);
          break;
        }
          
        case 'sync-all':
          await this.syncAllTasks();
          break;
          
        case 'webhook-test':
          await this.testWebhook();
          break;
          
        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log('Run "node github-cli.js help" for usage information');
      }
    } catch (error) {
      console.log('❌ Command failed:', error.message);
      console.log('\nFor help, run: node github-cli.js help');
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new GitHubCLI();
  cli.run().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = GitHubCLI;
# Success Criteria Integration Examples and Best Practices

**Version**: 1.0.0  
**Date**: 2025-09-15  
**Author**: Documentation Agent #5  

## Overview

This guide provides practical examples and best practices for integrating the Success Criteria System into your development workflow. It covers common integration patterns, automation strategies, and proven approaches for maximizing quality while maintaining development velocity.

## Development Workflow Integration

### Standard Development Workflow

#### Pre-Development Phase
```bash
#!/bin/bash
# pre-development-setup.sh

# 1. Initialize task with criteria
TASK_ID=$1
timeout 10s node taskmanager-api.js init
timeout 10s node taskmanager-api.js claim $TASK_ID

# 2. Review assigned success criteria
timeout 10s node taskmanager-api.js get-success-criteria $TASK_ID --format=checklist

# 3. Set up evidence collection
mkdir -p development/evidence/task_$TASK_ID/{automated,manual,files}

# 4. Configure automated validation tools
npm run setup-validation-tools

echo "Development setup complete for task: $TASK_ID"
echo "Review criteria checklist and begin implementation"
```

#### During Development
```bash
#!/bin/bash
# continuous-validation.sh

TASK_ID=$1

# Run quick validation checks
echo "Running continuous validation for task: $TASK_ID"

# 1. Linter check
npm run lint 2>&1 | tee development/evidence/task_$TASK_ID/automated/linter_$(date +%H%M%S).log

# 2. Quick test run
npm run test:unit 2>&1 | tee development/evidence/task_$TASK_ID/automated/tests_$(date +%H%M%S).log

# 3. Build check
npm run build 2>&1 | tee development/evidence/task_$TASK_ID/automated/build_$(date +%H%M%S).log

# 4. Update validation status
timeout 10s node taskmanager-api.js update-validation-progress $TASK_ID \
  --progress="development_in_progress" \
  --evidence-collected="linter,tests,build"

echo "Continuous validation complete"
```

#### Pre-Commit Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Get current task ID from branch or commit message
TASK_ID=$(git branch --show-current | grep -o 'feature_[0-9_a-z]*' || echo "")

if [ -n "$TASK_ID" ]; then
    echo "Running success criteria validation for: $TASK_ID"
    
    # Run essential validations before commit
    timeout 10s node taskmanager-api.js validate-criteria $TASK_ID \
        --category=automated \
        --fail-fast \
        --evidence-auto-collect
    
    if [ $? -eq 0 ]; then
        echo "✅ Pre-commit validation passed"
    else
        echo "❌ Pre-commit validation failed"
        echo "Fix issues before committing or use --no-verify to skip"
        exit 1
    fi
fi
```

### Feature Branch Workflow

#### Branch Creation with Criteria Setup
```bash
#!/bin/bash
# create-feature-branch.sh

TASK_ID=$1
FEATURE_NAME=$2

# 1. Create feature branch
git checkout -b feature/$TASK_ID-$FEATURE_NAME

# 2. Apply task-specific criteria
timeout 10s node taskmanager-api.js set-success-criteria $TASK_ID \
  --add-criteria='[{
    "category": "feature_specific",
    "title": "Feature Branch Integration",
    "requirements": [
      "Feature branch builds successfully",
      "All feature tests pass", 
      "Feature documentation complete",
      "Code review completed"
    ],
    "validation_method": "automated",
    "priority": "critical"
  }]'

# 3. Set up branch-specific validation
echo "TASK_ID=$TASK_ID" > .task_context
echo "FEATURE_NAME=$FEATURE_NAME" >> .task_context

# 4. Configure CI for this branch
cat > .github/workflows/feature-validation.yml << EOF
name: Feature Validation
on:
  push:
    branches: [ feature/$TASK_ID-* ]
  pull_request:
    branches: [ main ]

jobs:
  success-criteria-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Success Criteria Validation
        run: |
          timeout 10s node taskmanager-api.js validate-criteria $TASK_ID \\
            --evidence-auto-collect \\
            --output-format=github-actions
EOF

echo "Feature branch setup complete"
```

#### Pull Request Integration
```bash
#!/bin/bash
# pr-validation.sh

TASK_ID=$1
PR_NUMBER=$2

# 1. Run comprehensive validation
timeout 10s node taskmanager-api.js validate-criteria $TASK_ID \
  --type=comprehensive \
  --evidence-auto-collect \
  --output-format=markdown > pr-validation-report.md

# 2. Generate PR description with criteria status
cat > pr-description.md << EOF
## Success Criteria Validation

### Task: $TASK_ID

$(cat pr-validation-report.md)

### Manual Review Required
- [ ] Code review completed
- [ ] Architecture review (if applicable)
- [ ] Security review (if applicable)
- [ ] Documentation review

### Pre-merge Checklist
- [ ] All automated criteria passed
- [ ] Manual reviews completed
- [ ] Evidence collected and verified
- [ ] No criteria conflicts

EOF

# 3. Update PR with validation results
gh pr edit $PR_NUMBER --body-file pr-description.md

# 4. Request required reviews based on criteria
timeout 10s node taskmanager-api.js request-pr-reviews $TASK_ID $PR_NUMBER
```

## CI/CD Pipeline Integration

### GitHub Actions Integration

#### Complete Validation Workflow
```yaml
# .github/workflows/success-criteria-validation.yml
name: Success Criteria Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  extract-task-info:
    runs-on: ubuntu-latest
    outputs:
      task-id: ${{ steps.extract.outputs.task-id }}
      has-task: ${{ steps.extract.outputs.has-task }}
    steps:
      - uses: actions/checkout@v3
      - name: Extract Task ID
        id: extract
        run: |
          TASK_ID=$(echo "${{ github.head_ref }}" | grep -o 'feature_[0-9_a-z]*' || echo "")
          if [ -n "$TASK_ID" ]; then
            echo "task-id=$TASK_ID" >> $GITHUB_OUTPUT
            echo "has-task=true" >> $GITHUB_OUTPUT
          else
            echo "has-task=false" >> $GITHUB_OUTPUT
          fi

  automated-validation:
    runs-on: ubuntu-latest
    needs: extract-task-info
    if: needs.extract-task-info.outputs.has-task == 'true'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Linter
        run: |
          npm run lint -- --format=json > linter-results.json
          npm run lint || true
      
      - name: Run Tests
        run: |
          npm run test -- --coverage --json > test-results.json
          npm run test
      
      - name: Build Project
        run: |
          npm run build 2>&1 | tee build-output.log
      
      - name: Security Scan
        run: |
          npm audit --json > security-audit.json || true
          npm audit
      
      - name: Collect Evidence
        run: |
          mkdir -p evidence/automated
          mv linter-results.json evidence/automated/
          mv test-results.json evidence/automated/
          mv build-output.log evidence/automated/
          mv security-audit.json evidence/automated/
      
      - name: Upload Evidence
        uses: actions/upload-artifact@v3
        with:
          name: validation-evidence
          path: evidence/
      
      - name: Run Success Criteria Validation
        env:
          TASK_ID: ${{ needs.extract-task-info.outputs.task-id }}
        run: |
          timeout 10s node taskmanager-api.js validate-criteria $TASK_ID \
            --evidence-dir=evidence/ \
            --output-format=github-actions \
            --fail-on-incomplete

  manual-review-request:
    runs-on: ubuntu-latest
    needs: [extract-task-info, automated-validation]
    if: needs.extract-task-info.outputs.has-task == 'true'
    steps:
      - uses: actions/checkout@v3
      
      - name: Request Manual Reviews
        env:
          TASK_ID: ${{ needs.extract-task-info.outputs.task-id }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: |
          timeout 10s node taskmanager-api.js request-manual-reviews $TASK_ID \
            --context="github-pr" \
            --pr-number=$PR_NUMBER

  validation-report:
    runs-on: ubuntu-latest
    needs: [extract-task-info, automated-validation]
    if: always() && needs.extract-task-info.outputs.has-task == 'true'
    steps:
      - uses: actions/checkout@v3
      
      - name: Download Evidence
        uses: actions/download-artifact@v3
        with:
          name: validation-evidence
          path: evidence/
      
      - name: Generate Validation Report
        env:
          TASK_ID: ${{ needs.extract-task-info.outputs.task-id }}
        run: |
          timeout 10s node taskmanager-api.js generate-validation-report $TASK_ID \
            --format=markdown \
            --include-evidence \
            --output=validation-report.md
      
      - name: Comment PR with Report
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('validation-report.md', 'utf8');
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Success Criteria Validation Report\n\n${report}`
            });
```

### Jenkins Pipeline Integration

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        TASK_ID = sh(
            script: "echo ${env.BRANCH_NAME} | grep -o 'feature_[0-9_a-z]*' || echo ''",
            returnStdout: true
        ).trim()
    }
    
    stages {
        stage('Setup') {
            when {
                expression { env.TASK_ID != '' }
            }
            steps {
                script {
                    echo "Setting up validation for task: ${env.TASK_ID}"
                    sh "mkdir -p evidence/automated"
                }
            }
        }
        
        stage('Automated Validation') {
            when {
                expression { env.TASK_ID != '' }
            }
            parallel {
                stage('Linting') {
                    steps {
                        script {
                            sh """
                                npm run lint -- --format=json > evidence/automated/linter-results.json || true
                                npm run lint
                            """
                        }
                    }
                }
                
                stage('Testing') {
                    steps {
                        script {
                            sh """
                                npm run test -- --coverage --json > evidence/automated/test-results.json
                                npm run test
                            """
                        }
                    }
                }
                
                stage('Building') {
                    steps {
                        script {
                            sh """
                                npm run build 2>&1 | tee evidence/automated/build-output.log
                            """
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        script {
                            sh """
                                npm audit --json > evidence/automated/security-audit.json || true
                                npm audit
                            """
                        }
                    }
                }
            }
        }
        
        stage('Success Criteria Validation') {
            when {
                expression { env.TASK_ID != '' }
            }
            steps {
                script {
                    sh """
                        timeout 10s node taskmanager-api.js validate-criteria ${env.TASK_ID} \\
                            --evidence-dir=evidence/ \\
                            --output-format=jenkins \\
                            --output-file=validation-results.json
                    """
                    
                    // Parse results and set build status
                    def results = readJSON file: 'validation-results.json'
                    if (results.overall_status != 'passed') {
                        currentBuild.result = 'UNSTABLE'
                        error "Success criteria validation failed"
                    }
                }
            }
        }
        
        stage('Generate Report') {
            when {
                expression { env.TASK_ID != '' }
            }
            steps {
                script {
                    sh """
                        timeout 10s node taskmanager-api.js generate-validation-report ${env.TASK_ID} \\
                            --format=html \\
                            --include-evidence \\
                            --output=validation-report.html
                    """
                    
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'validation-report.html',
                        reportName: 'Success Criteria Report'
                    ])
                }
            }
        }
    }
    
    post {
        always {
            script {
                if (env.TASK_ID != '') {
                    archiveArtifacts artifacts: 'evidence/**/*', fingerprint: true
                    archiveArtifacts artifacts: 'validation-results.json', fingerprint: true
                }
            }
        }
        
        failure {
            script {
                if (env.TASK_ID != '') {
                    sh """
                        timeout 10s node taskmanager-api.js update-validation-status ${env.TASK_ID} \\
                            --status=failed \\
                            --context="jenkins-pipeline" \\
                            --build-url=${env.BUILD_URL}
                    """
                }
            }
        }
        
        success {
            script {
                if (env.TASK_ID != '') {
                    sh """
                        timeout 10s node taskmanager-api.js update-validation-status ${env.TASK_ID} \\
                            --status=passed \\
                            --context="jenkins-pipeline" \\
                            --build-url=${env.BUILD_URL}
                    """
                }
            }
        }
    }
}
```

## IDE Integration

### VS Code Extension

#### settings.json Configuration
```json
{
  "successCriteria.enabled": true,
  "successCriteria.taskManager.apiPath": "/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js",
  "successCriteria.validation.onSave": true,
  "successCriteria.validation.showInProblems": true,
  "successCriteria.evidence.autoCollect": true,
  "successCriteria.notifications.enabled": true,
  "successCriteria.statusBar.show": true
}
```

#### Extension Integration Script
```javascript
// vs-code-extension/src/successCriteriaProvider.js
const vscode = require('vscode');
const { exec } = require('child_process');

class SuccessCriteriaProvider {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            100
        );
        this.currentTaskId = null;
        this.validationStatus = 'unknown';
    }

    activate(context) {
        // Register commands
        const validateCommand = vscode.commands.registerCommand(
            'successCriteria.validate',
            () => this.validateCurrentTask()
        );

        const showCriteriaCommand = vscode.commands.registerCommand(
            'successCriteria.showCriteria',
            () => this.showTaskCriteria()
        );

        // Set up file watcher for automatic validation
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,py}');
        watcher.onDidSave(() => this.onFileSave());

        // Update status bar
        this.updateStatusBar();

        context.subscriptions.push(
            validateCommand,
            showCriteriaCommand,
            watcher,
            this.statusBarItem
        );
    }

    async validateCurrentTask() {
        if (!this.currentTaskId) {
            await this.detectCurrentTask();
        }

        if (!this.currentTaskId) {
            vscode.window.showWarningMessage('No active task detected');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Validating task ${this.currentTaskId}`,
            cancellable: false
        }, async (progress) => {
            try {
                const result = await this.runValidation(this.currentTaskId);
                this.handleValidationResult(result);
            } catch (error) {
                vscode.window.showErrorMessage(`Validation failed: ${error.message}`);
            }
        });
    }

    async runValidation(taskId) {
        return new Promise((resolve, reject) => {
            exec(
                `timeout 10s node taskmanager-api.js validate-criteria ${taskId} --format=json`,
                { cwd: vscode.workspace.rootPath },
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        try {
                            resolve(JSON.parse(stdout));
                        } catch (parseError) {
                            reject(parseError);
                        }
                    }
                }
            );
        });
    }

    handleValidationResult(result) {
        this.validationStatus = result.overall_status;
        this.updateStatusBar();

        // Show validation problems in Problems panel
        this.updateProblemsPanel(result);

        // Show notification
        if (result.overall_status === 'passed') {
            vscode.window.showInformationMessage(
                `✅ All success criteria passed (${result.criteria_summary.passed}/${result.criteria_summary.total})`
            );
        } else {
            vscode.window.showWarningMessage(
                `⚠️ Some criteria failed (${result.criteria_summary.failed} failed, ${result.criteria_summary.pending} pending)`
            );
        }
    }

    updateStatusBar() {
        if (this.currentTaskId) {
            const icon = this.getStatusIcon();
            this.statusBarItem.text = `${icon} ${this.currentTaskId}`;
            this.statusBarItem.tooltip = `Success Criteria: ${this.validationStatus}`;
            this.statusBarItem.command = 'successCriteria.showCriteria';
        } else {
            this.statusBarItem.text = '$(search) No Task';
            this.statusBarItem.tooltip = 'Click to detect current task';
            this.statusBarItem.command = 'successCriteria.detectTask';
        }
        this.statusBarItem.show();
    }

    getStatusIcon() {
        switch (this.validationStatus) {
            case 'passed': return '$(check)';
            case 'failed': return '$(error)';
            case 'pending': return '$(clock)';
            case 'in_progress': return '$(sync)';
            default: return '$(question)';
        }
    }
}

module.exports = SuccessCriteriaProvider;
```

### IntelliJ IDEA Plugin

#### Plugin Configuration
```xml
<!-- plugin.xml -->
<idea-plugin>
  <id>com.company.success-criteria</id>
  <name>Success Criteria Integration</name>
  <version>1.0.0</version>
  
  <depends>com.intellij.modules.platform</depends>
  
  <extensions defaultExtensionNs="com.intellij">
    <toolWindow id="Success Criteria" anchor="bottom" 
                factoryClass="com.company.successcriteria.SuccessCriteriaToolWindowFactory"/>
    
    <annotator language="JavaScript" 
               implementationClass="com.company.successcriteria.CriteriaAnnotator"/>
    
    <applicationService serviceInterface="com.company.successcriteria.CriteriaService"
                       serviceImplementation="com.company.successcriteria.CriteriaServiceImpl"/>
  </extensions>
  
  <actions>
    <action id="ValidateSuccessCriteria" 
            class="com.company.successcriteria.ValidateAction"
            text="Validate Success Criteria">
      <add-to-group group-id="BuildMenu" anchor="after" relative-to-action="CompileDirty"/>
    </action>
  </actions>
</idea-plugin>
```

## Team Collaboration Patterns

### Code Review Integration

#### Review Request Automation
```bash
#!/bin/bash
# request-code-review.sh

TASK_ID=$1
REVIEWER=$2

# 1. Generate pre-review validation
timeout 10s node taskmanager-api.js validate-criteria $TASK_ID \
  --pre-review \
  --output=pre-review-report.md

# 2. Create review context
timeout 10s node taskmanager-api.js generate-review-context $TASK_ID \
  --include-criteria \
  --include-evidence \
  --output=review-context.json

# 3. Request review with context
gh pr review --request $REVIEWER \
  --message "$(cat pre-review-report.md)"

# 4. Update success criteria with review assignment
timeout 10s node taskmanager-api.js assign-manual-reviewer $TASK_ID \
  --criterion=code_review \
  --reviewer=$REVIEWER \
  --context-file=review-context.json

echo "Code review requested from $REVIEWER for task $TASK_ID"
```

#### Review Completion Integration
```bash
#!/bin/bash
# complete-code-review.sh

TASK_ID=$1
REVIEWER_ID=$2
APPROVAL_STATUS=$3  # approved|changes_requested|commented

# 1. Record review completion
timeout 10s node taskmanager-api.js complete-manual-review $TASK_ID \
  --criterion=code_review \
  --reviewer=$REVIEWER_ID \
  --status=$APPROVAL_STATUS \
  --evidence-file=review-comments.md

# 2. Update task validation status
if [ "$APPROVAL_STATUS" = "approved" ]; then
    timeout 10s node taskmanager-api.js update-criterion-status $TASK_ID \
      --criterion=code_review \
      --status=passed
else
    timeout 10s node taskmanager-api.js update-criterion-status $TASK_ID \
      --criterion=code_review \
      --status=requires_changes \
      --notes="Review feedback requires implementation changes"
fi

# 3. Check if all criteria now satisfied
timeout 10s node taskmanager-api.js check-completion-readiness $TASK_ID
```

### Cross-Team Review Workflows

#### Security Team Integration
```bash
#!/bin/bash
# security-review-workflow.sh

TASK_ID=$1

# 1. Detect if security review is required
SECURITY_REQUIRED=$(timeout 10s node taskmanager-api.js check-security-requirement $TASK_ID)

if [ "$SECURITY_REQUIRED" = "true" ]; then
    echo "Security review required for task: $TASK_ID"
    
    # 2. Prepare security review package
    timeout 10s node taskmanager-api.js prepare-security-review $TASK_ID \
      --include-threat-model \
      --include-data-flow \
      --include-dependencies \
      --output=security-review-package.zip
    
    # 3. Submit to security team
    timeout 10s node taskmanager-api.js submit-security-review $TASK_ID \
      --package=security-review-package.zip \
      --priority=normal \
      --deadline="+7 days"
    
    # 4. Set up notification for completion
    timeout 10s node taskmanager-api.js setup-review-notification $TASK_ID \
      --review-type=security \
      --notification-channel=slack \
      --notification-target=#security-reviews
    
    echo "Security review submitted - tracking ID: $(cat .security-review-id)"
else
    echo "No security review required for task: $TASK_ID"
fi
```

#### Architecture Review Process
```bash
#!/bin/bash
# architecture-review-workflow.sh

TASK_ID=$1

# 1. Check if architecture review is needed
ARCH_COMPLEXITY=$(timeout 10s node taskmanager-api.js assess-architecture-complexity $TASK_ID)

if [ "$ARCH_COMPLEXITY" = "high" ] || [ "$ARCH_COMPLEXITY" = "medium" ]; then
    echo "Architecture review required - complexity: $ARCH_COMPLEXITY"
    
    # 2. Generate architecture documentation
    timeout 10s node taskmanager-api.js generate-architecture-docs $TASK_ID \
      --include-diagrams \
      --include-decisions \
      --include-alternatives \
      --output=architecture-review-docs/
    
    # 3. Request architecture review
    timeout 10s node taskmanager-api.js request-architecture-review $TASK_ID \
      --complexity=$ARCH_COMPLEXITY \
      --docs-location=architecture-review-docs/ \
      --reviewer-pool=architecture_team
    
    echo "Architecture review requested for task: $TASK_ID"
fi
```

## Advanced Integration Patterns

### Multi-Repository Project Integration

#### Monorepo Configuration
```json
{
  "success_criteria_config": {
    "multi_package_support": true,
    "package_specific_criteria": {
      "packages/frontend": {
        "additional_criteria": ["accessibility", "performance"],
        "validation_tools": ["lighthouse", "axe-core"]
      },
      "packages/backend": {
        "additional_criteria": ["api_documentation", "load_testing"],
        "validation_tools": ["swagger", "k6"]
      },
      "packages/shared": {
        "additional_criteria": ["breaking_change_detection"],
        "validation_tools": ["api-extractor"]
      }
    },
    "cross_package_validation": {
      "integration_tests": true,
      "api_compatibility": true,
      "dependency_consistency": true
    }
  }
}
```

#### Cross-Package Validation Script
```bash
#!/bin/bash
# validate-monorepo.sh

TASK_ID=$1

# 1. Detect affected packages
AFFECTED_PACKAGES=$(timeout 10s node taskmanager-api.js detect-affected-packages $TASK_ID)

echo "Affected packages: $AFFECTED_PACKAGES"

# 2. Run package-specific validations
for package in $AFFECTED_PACKAGES; do
    echo "Validating package: $package"
    
    timeout 10s node taskmanager-api.js validate-package-criteria $TASK_ID \
      --package=$package \
      --evidence-dir=evidence/$package/
done

# 3. Run cross-package validations
timeout 10s node taskmanager-api.js validate-cross-package-criteria $TASK_ID \
  --packages="$AFFECTED_PACKAGES" \
  --include-integration-tests

# 4. Generate consolidated report
timeout 10s node taskmanager-api.js generate-monorepo-report $TASK_ID \
  --packages="$AFFECTED_PACKAGES" \
  --output=monorepo-validation-report.html
```

### Microservices Integration

#### Service-Level Criteria Configuration
```json
{
  "microservices_criteria": {
    "service_user_auth": {
      "service_specific_criteria": [
        {
          "title": "Authentication Performance",
          "requirements": [
            "Login endpoint < 200ms response time",
            "Token validation < 50ms",
            "Password hashing uses bcrypt with 12 rounds"
          ]
        }
      ],
      "integration_criteria": [
        {
          "title": "Service Mesh Integration",
          "requirements": [
            "Service registration with discovery",
            "Circuit breaker configuration",
            "Health check endpoints"
          ]
        }
      ]
    }
  }
}
```

#### Service Integration Validation
```bash
#!/bin/bash
# validate-microservice-integration.sh

TASK_ID=$1
SERVICE_NAME=$2

# 1. Validate service-specific criteria
timeout 10s node taskmanager-api.js validate-service-criteria $TASK_ID \
  --service=$SERVICE_NAME \
  --include-performance-tests

# 2. Test service integration
timeout 10s node taskmanager-api.js test-service-integration $TASK_ID \
  --service=$SERVICE_NAME \
  --test-discovery \
  --test-communication \
  --test-resilience

# 3. Validate API contracts
timeout 10s node taskmanager-api.js validate-api-contracts $TASK_ID \
  --service=$SERVICE_NAME \
  --contract-testing-tool=pact

# 4. Check deployment readiness
timeout 10s node taskmanager-api.js check-deployment-readiness $TASK_ID \
  --service=$SERVICE_NAME \
  --environment=staging
```

## Best Practices Summary

### Development Best Practices

1. **Early Validation**
   - Run criteria validation frequently during development
   - Use pre-commit hooks for essential validations
   - Set up continuous validation in development environment

2. **Evidence Collection**
   - Automate evidence collection wherever possible
   - Structure evidence files consistently
   - Include timestamps and context in evidence

3. **Incremental Validation**
   - Validate criteria incrementally as work progresses
   - Don't wait until task completion for validation
   - Use partial validation for faster feedback

### Team Collaboration Best Practices

1. **Clear Communication**
   - Include criteria status in PR descriptions
   - Use validation reports in code reviews
   - Communicate criteria changes to team members

2. **Review Efficiency**
   - Provide context and evidence to reviewers
   - Use automated checks to reduce manual review burden
   - Set clear expectations for review timelines

3. **Conflict Resolution**
   - Document criteria override decisions
   - Involve stakeholders in criteria conflicts
   - Maintain audit trail of changes

### System Integration Best Practices

1. **Configuration Management**
   - Version control all configuration files
   - Use environment-specific configurations
   - Document configuration changes

2. **Monitoring and Alerting**
   - Set up monitoring for validation performance
   - Alert on high failure rates or system issues
   - Track metrics for continuous improvement

3. **Maintenance**
   - Regularly update criteria templates
   - Clean up old evidence files
   - Review and optimize validation performance

---

*Integration Guide v1.0.0*  
*Generated by: Documentation Agent #5*  
*Last Updated: 2025-09-15*
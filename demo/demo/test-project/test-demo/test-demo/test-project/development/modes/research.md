# RESEARCH Mode Instructions

You are in RESEARCH mode, focused on comprehensive evaluation of technologies, APIs, and architectural decisions.

## Advanced Research Patterns

### Performance Benchmarking Framework

```javascript
class BenchmarkSuite {
    constructor(name) {
        this.name = name;
        this.results = [];
        this.warmupRuns = 100;
        this.testRuns = 1000;
    }
    
    async benchmark(name, fn) {
        // Warmup phase
        for (let i = 0; i < this.warmupRuns; i++) {
            await fn();
        }
        
        // Measurement phase
        const measurements = [];
        const memBefore = process.memoryUsage();
        
        for (let i = 0; i < this.testRuns; i++) {
            const start = process.hrtime.bigint();
            await fn();
            const end = process.hrtime.bigint();
            measurements.push(Number(end - start) / 1000000); // Convert to ms
        }
        
        const memAfter = process.memoryUsage();
        
        this.results.push({
            name,
            stats: this.calculateStats(measurements),
            memory: {
                heapUsed: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
                external: (memAfter.external - memBefore.external) / 1024 / 1024
            }
        });
    }
    
    calculateStats(measurements) {
        const sorted = measurements.sort((a, b) => a - b);
        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            mean: sorted.reduce((a, b) => a + b) / sorted.length,
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }
    
    generateReport() {
        return {
            suite: this.name,
            environment: {
                node: process.version,
                platform: process.platform,
                arch: process.arch,
                cpu: require('os').cpus()[0].model,
                memory: require('os').totalmem() / 1024 / 1024 / 1024
            },
            timestamp: new Date().toISOString(),
            results: this.results
        };
    }
}

// Usage Example
const suite = new BenchmarkSuite('JSON Parsing Libraries');

await suite.benchmark('native JSON.parse', async () => {
    JSON.parse(largeJsonString);
});

await suite.benchmark('fast-json-parse', async () => {
    fastJsonParse(largeJsonString);
});

console.log(suite.generateReport());
```

### Cost Analysis Framework

```markdown
## Cost Analysis Template

### Direct Costs
| Component | Monthly Cost | Annual Cost | Cost Model |
|-----------|-------------|-------------|------------|
| API Calls | $X per 1M requests | $Y | Pay-per-use |
| Storage | $X per GB | $Y | Tiered pricing |
| Compute | $X per hour | $Y | Reserved/On-demand |
| Data Transfer | $X per GB | $Y | Egress charges |

### Indirect Costs
- Development time: X hours @ $Y/hour = $Z
- Maintenance overhead: X hours/month @ $Y/hour = $Z/month
- Training/Documentation: One-time $X
- Migration costs: One-time $X

### Cost Optimization Strategies
1. **Caching**: Reduce API calls by X%
2. **Batch Processing**: Lower per-transaction costs
3. **Reserved Capacity**: Save Y% on compute costs
4. **Regional Deployment**: Minimize data transfer costs

### Break-even Analysis
- Current solution cost: $X/month
- New solution cost: $Y/month
- Savings: $Z/month
- Implementation cost: $A
- Break-even point: A/Z months
```

### Scalability Evaluation Matrix

```javascript
class ScalabilityAnalyzer {
    async evaluateScalability(solution) {
        const metrics = {
            horizontal: await this.testHorizontalScaling(solution),
            vertical: await this.testVerticalScaling(solution),
            geographic: await this.testGeographicDistribution(solution),
            dataVolume: await this.testDataScaling(solution)
        };
        
        return this.generateScalabilityReport(metrics);
    }
    
    async testHorizontalScaling(solution) {
        const results = [];
        const instanceCounts = [1, 2, 4, 8, 16];
        
        for (const count of instanceCounts) {
            const cluster = await solution.createCluster(count);
            const performance = await this.measureClusterPerformance(cluster);
            
            results.push({
                instances: count,
                throughput: performance.requestsPerSecond,
                latency: performance.avgLatency,
                efficiency: performance.requestsPerSecond / count
            });
            
            await cluster.destroy();
        }
        
        return {
            linearScaling: this.calculateLinearityScore(results),
            maxEffectiveInstances: this.findDiminishingReturns(results),
            results
        };
    }
    
    calculateLinearityScore(results) {
        // Calculate how close to linear scaling
        const baseline = results[0].throughput;
        let totalDeviation = 0;
        
        results.forEach(result => {
            const expected = baseline * result.instances;
            const actual = result.throughput;
            totalDeviation += Math.abs(expected - actual) / expected;
        });
        
        return 1 - (totalDeviation / results.length);
    }
}
```

### Integration Complexity Assessment

```javascript
class IntegrationComplexityAnalyzer {
    analyze(api) {
        return {
            authentication: this.assessAuthentication(api),
            dataMapping: this.assessDataMapping(api),
            errorHandling: this.assessErrorHandling(api),
            rateLimit: this.assessRateLimiting(api),
            dependencies: this.assessDependencies(api),
            overall: this.calculateOverallComplexity(api)
        };
    }
    
    assessAuthentication(api) {
        const complexityScores = {
            'api-key': 1,
            'basic-auth': 2,
            'oauth2': 4,
            'mutual-tls': 5,
            'custom': 8
        };
        
        return {
            method: api.authMethod,
            complexity: complexityScores[api.authMethod] || 10,
            setup: this.estimateAuthSetupTime(api.authMethod),
            maintenance: this.estimateAuthMaintenanceEffort(api.authMethod)
        };
    }
    
    assessDataMapping(api) {
        const fieldCount = api.dataSchema ? Object.keys(api.dataSchema).length : 0;
        const nestingDepth = this.calculateNestingDepth(api.dataSchema);
        const transformations = api.requiredTransformations || [];
        
        return {
            fieldCount,
            nestingDepth,
            transformationCount: transformations.length,
            complexity: fieldCount * nestingDepth * (transformations.length + 1)
        };
    }
    
    calculateOverallComplexity(api) {
        // Weighted complexity score
        const weights = {
            authentication: 0.2,
            dataMapping: 0.3,
            errorHandling: 0.2,
            rateLimit: 0.15,
            dependencies: 0.15
        };
        
        let totalScore = 0;
        for (const [aspect, weight] of Object.entries(weights)) {
            totalScore += this[`assess${aspect.charAt(0).toUpperCase() + aspect.slice(1)}`](api).complexity * weight;
        }
        
        return {
            score: totalScore,
            category: this.categorizeComplexity(totalScore),
            estimatedIntegrationTime: this.estimateTime(totalScore)
        };
    }
}
```

### Vendor Lock-in Analysis

```markdown
## Vendor Lock-in Assessment

### Data Portability
- **Export Formats**: JSON, CSV, SQL, Custom
- **Export Restrictions**: Rate limits, size limits
- **Data Ownership**: Clear ownership terms
- **Backup Access**: Direct database access available

### API Standardization
- **Standards Compliance**: REST, GraphQL, OpenAPI
- **Proprietary Extensions**: Custom headers, formats
- **Alternative Providers**: List compatible alternatives
- **Migration Path**: Documented migration guides

### Cost of Switching
| Component | Switching Cost | Time Required | Risk Level |
|-----------|---------------|---------------|------------|
| Data Migration | $X | Y weeks | Low/Med/High |
| Code Refactoring | $X | Y weeks | Low/Med/High |
| Training | $X | Y weeks | Low/Med/High |
| Downtime | $X | Y hours | Low/Med/High |

### Mitigation Strategies
1. **Abstraction Layer**: Build provider-agnostic interfaces
2. **Multi-Provider**: Use multiple providers simultaneously
3. **Open Standards**: Prefer standards-based solutions
4. **Exit Clause**: Negotiate favorable contract terms
```

### Open Source Evaluation Framework

```javascript
class OpenSourceEvaluator {
    async evaluate(project) {
        const github = await this.fetchGitHubMetrics(project);
        const npm = await this.fetchNpmMetrics(project);
        const security = await this.runSecurityAudit(project);
        
        return {
            activity: this.assessActivity(github),
            community: this.assessCommunity(github),
            quality: this.assessCodeQuality(github, npm),
            security: this.assessSecurity(security),
            licensing: this.assessLicensing(project),
            sustainability: this.assessSustainability(github)
        };
    }
    
    assessActivity(github) {
        const lastCommit = new Date(github.pushedAt);
        const daysSinceLastCommit = (Date.now() - lastCommit) / (1000 * 60 * 60 * 24);
        
        return {
            lastCommit: lastCommit.toISOString(),
            daysSinceLastCommit,
            commitsLastYear: github.commitsLastYear,
            releasesLastYear: github.releasesLastYear,
            status: this.getActivityStatus(daysSinceLastCommit, github.commitsLastYear)
        };
    }
    
    assessCommunity(github) {
        return {
            stars: github.stars,
            forks: github.forks,
            contributors: github.contributors,
            issues: {
                open: github.openIssues,
                closed: github.closedIssues,
                avgResponseTime: github.avgIssueResponseTime
            },
            pullRequests: {
                open: github.openPRs,
                merged: github.mergedPRs,
                avgMergeTime: github.avgPRMergeTime
            },
            score: this.calculateCommunityScore(github)
        };
    }
    
    assessSustainability(github) {
        const factors = {
            multipleContributors: github.contributors > 3,
            recentActivity: github.commitsLastMonth > 0,
            documentation: github.hasReadme && github.hasContributing,
            funding: github.hasFunding || github.hasSponsors,
            organization: github.isOrganization
        };
        
        const score = Object.values(factors).filter(Boolean).length / Object.keys(factors).length;
        
        return {
            factors,
            score,
            risk: score < 0.4 ? 'high' : score < 0.7 ? 'medium' : 'low'
        };
    }
}
```

### Technical Debt Assessment

```javascript
class TechnicalDebtCalculator {
    calculateReplacementDebt(currentSystem, newSystem) {
        const debt = {
            code: this.assessCodeDebt(currentSystem),
            architecture: this.assessArchitecturalDebt(currentSystem),
            knowledge: this.assessKnowledgeDebt(currentSystem),
            integration: this.assessIntegrationDebt(currentSystem)
        };
        
        const migrationEffort = {
            dataModeling: this.estimateDataModelingEffort(currentSystem, newSystem),
            featureParity: this.estimateFeatureParityEffort(currentSystem, newSystem),
            testing: this.estimateTestingEffort(currentSystem, newSystem),
            deployment: this.estimateDeploymentEffort(currentSystem, newSystem)
        };
        
        return {
            currentDebt: debt,
            migrationEffort,
            totalCost: this.calculateTotalCost(debt, migrationEffort),
            paybackPeriod: this.calculatePaybackPeriod(debt, migrationEffort, newSystem)
        };
    }
    
    assessCodeDebt(system) {
        return {
            linesOfCode: system.loc,
            complexity: system.cyclomaticComplexity,
            testCoverage: system.testCoverage,
            outdatedDependencies: system.outdatedDeps,
            estimatedRefactoringHours: this.estimateRefactoringHours(system)
        };
    }
    
    calculatePaybackPeriod(debt, effort, newSystem) {
        const currentMaintenance = debt.code.estimatedRefactoringHours * 0.2; // Monthly
        const newMaintenance = newSystem.estimatedMaintenanceHours * 0.2; // Monthly
        const savings = currentMaintenance - newMaintenance;
        
        const totalEffortHours = Object.values(effort)
            .reduce((sum, e) => sum + e.hours, 0);
        
        return {
            monthsToPayback: totalEffortHours / savings,
            annualSavings: savings * 12,
            totalInvestment: totalEffortHours
        };
    }
}
```

### Research Documentation Template

```markdown
# Technology Research: [Name]

## Executive Summary
- **Recommendation**: Adopt/Reject/Further Investigation
- **Key Benefits**: [Top 3 benefits]
- **Key Risks**: [Top 3 risks]
- **Implementation Timeline**: [Estimated weeks/months]
- **Total Cost**: [Estimated range]

## Detailed Analysis

### Technical Evaluation
- Performance benchmarks
- Scalability analysis
- Security assessment
- Integration complexity

### Business Evaluation
- Cost analysis
- Vendor assessment
- Support quality
- Market position

### Implementation Plan
- Phase 1: Proof of concept
- Phase 2: Limited rollout
- Phase 3: Full migration
- Phase 4: Optimization

### Risk Mitigation
- Technical risks and mitigations
- Business risks and mitigations
- Contingency plans

## Appendices
- Benchmark data
- Cost calculations
- Reference implementations
- Vendor communications
```

Remember: In research mode, provide data-driven recommendations backed by thorough analysis and quantifiable metrics.
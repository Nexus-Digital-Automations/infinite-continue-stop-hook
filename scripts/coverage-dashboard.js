#!/usr/bin/env node

/**
 * Coverage Monitoring Dashboard
 * Generates a simple HTML dashboard for coverage monitoring
 */

const fs = require('fs');

class CoverageDashboard {
    constructor(options = {}) {
        this.options = {
            reportsDir: './coverage/reports',
            outputFile: './coverage/dashboard.html',
            trendsFile: './coverage/reports/coverage-trends.json',
            validationFile: './coverage/reports/coverage-validation.json',
            ...options
        };
    }

    async generate() {
        console.log('📊 Generating coverage dashboard...');
        
        const trends = this.loadTrends();
        const validation = this.loadValidation();
        
        const html = this.generateHTML(trends, validation);
        
        fs.writeFileSync(this.options.outputFile, html);
        console.log(`✅ Dashboard generated: ${this.options.outputFile}`);
    }

    loadTrends() {
        try {
            if (fs.existsSync(this.options.trendsFile)) {
                return JSON.parse(fs.readFileSync(this.options.trendsFile, 'utf8'));
            }
        } catch (error) {
            console.warn(`Warning: Could not load trends: ${error.message}`);
        }
        return [];
    }

    loadValidation() {
        try {
            if (fs.existsSync(this.options.validationFile)) {
                return JSON.parse(fs.readFileSync(this.options.validationFile, 'utf8'));
            }
        } catch (error) {
            console.warn(`Warning: Could not load validation: ${error.message}`);
        }
        return null;
    }

    generateHTML(trends, validation) {
        const currentCoverage = validation?.validation?.summary || {
            statements: 0, branches: 0, functions: 0, lines: 0
        };
        
        const status = validation?.validation?.passed ? 'PASSED' : 'FAILED';
        const statusClass = validation?.validation?.passed ? 'success' : 'failure';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Monitoring Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .status {
            padding: 10px 20px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.failure {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .metric-label {
            color: #6c757d;
            margin-top: 5px;
        }
        .chart-container {
            margin: 30px 0;
        }
        .chart {
            width: 100%;
            height: 300px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .timestamp {
            color: #6c757d;
            font-size: 0.9em;
        }
        .failures, .warnings {
            margin-top: 20px;
        }
        .failures h3 {
            color: #dc3545;
        }
        .warnings h3 {
            color: #ffc107;
        }
        .failures ul, .warnings ul {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Coverage Monitoring Dashboard</h1>
            <div class="status ${statusClass}">
                Status: ${status}
            </div>
            <p class="timestamp">
                Last Updated: ${new Date().toLocaleString()}
            </p>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${currentCoverage.statements.toFixed(1)}%</div>
                <div class="metric-label">Statements</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${currentCoverage.branches.toFixed(1)}%</div>
                <div class="metric-label">Branches</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${currentCoverage.functions.toFixed(1)}%</div>
                <div class="metric-label">Functions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${currentCoverage.lines.toFixed(1)}%</div>
                <div class="metric-label">Lines</div>
            </div>
        </div>

        ${trends.length > 1 ? `
        <div class="chart-container">
            <h2>Coverage Trends</h2>
            <canvas id="coverageChart" class="chart"></canvas>
        </div>
        ` : ''}

        ${validation?.validation?.failures?.length > 0 ? `
        <div class="failures">
            <h3>❌ Validation Failures</h3>
            <ul>
                ${validation.validation.failures.map(f => `<li>${f}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${validation?.validation?.warnings?.length > 0 ? `
        <div class="warnings">
            <h3>⚠️ Warnings</h3>
            <ul>
                ${validation.validation.warnings.map(w => `<li>${w}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${trends.length > 0 ? `
        <div class="trends-table">
            <h2>Recent Coverage History</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Statements</th>
                        <th>Branches</th>
                        <th>Functions</th>
                        <th>Lines</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${trends.slice(-10).reverse().map(trend => `
                        <tr>
                            <td>${new Date(trend.timestamp).toLocaleDateString()}</td>
                            <td>${trend.coverage.statements.toFixed(1)}%</td>
                            <td>${trend.coverage.branches.toFixed(1)}%</td>
                            <td>${trend.coverage.functions.toFixed(1)}%</td>
                            <td>${trend.coverage.lines.toFixed(1)}%</td>
                            <td>${trend.passed ? '✅' : '❌'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
    </div>

    ${trends.length > 1 ? `
    <script>
        const ctx = document.getElementById('coverageChart').getContext('2d');
        const trends = ${JSON.stringify(trends.slice(-30))};
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: trends.map(t => new Date(t.timestamp).toLocaleDateString()),
                datasets: [
                    {
                        label: 'Statements',
                        data: trends.map(t => t.coverage.statements),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Branches',
                        data: trends.map(t => t.coverage.branches),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Functions',
                        data: trends.map(t => t.coverage.functions),
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Lines',
                        data: trends.map(t => t.coverage.lines),
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Coverage Trends Over Time'
                    }
                }
            }
        });
    </script>
    ` : ''}
</body>
</html>`;
    }
}

// CLI interface
if (require.main === module) {
    const dashboard = new CoverageDashboard();
    dashboard.generate()
        .then(() => {
            console.log('✅ Coverage dashboard generated successfully');
        })
        .catch(error => {
            console.error('❌ Failed to generate dashboard:', error.message);
            process.exit(1);
        });
}

module.exports = CoverageDashboard;
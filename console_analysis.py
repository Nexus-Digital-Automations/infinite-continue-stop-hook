#!/usr/bin/env python3
"""
Comprehensive Console Statement Analysis for Finance AI Platform
Categorizes console statements by file type and provides fixing strategy recommendations
"""

import os
import re
import json

def analyze_console_statements():
    """Comprehensive analysis of console statements in the finance AI platform"""
    
    frontend_path = "/Users/jeremyparker/Desktop/Claude Coding Projects/finance-ai-research-platform/frontend"
    
    # Categories for analysis
    categories = {
        "development_debugging": {
            "patterns": ["test", "debug", "spec", "mock", "__tests__", "development/", "validation", "bundle-validator", "phase.*validation", "demo"],
            "files": [],
            "count": 0,
            "strategy": "eslint-disable"
        },
        "core_application": {
            "patterns": ["src/pages/", "src/components/", "src/hooks/", "src/services/", "src/utils/"],
            "exclude_patterns": ["test", "debug", "spec", "mock", "__tests__", "validation", "demo", "phase.*validation"],
            "files": [],
            "count": 0,
            "strategy": "proper_logging"
        },
        "build_scripts": {
            "patterns": ["vite.config", "scripts/", "bundle-", "analyze-", "lint-"],
            "files": [],
            "count": 0,
            "strategy": "eslint-disable"
        },
        "removable": {
            "patterns": ["temp", "quick-", "simple-", "temporary"],
            "files": [],
            "count": 0,
            "strategy": "remove"
        }
    }
    
    console_files = []
    
    # Walk through frontend directory
    for root, dirs, files in os.walk(frontend_path):
        # Skip node_modules and dist directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', 'dist', 'coverage', '.vite']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, frontend_path)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    console_pattern = re.compile(r'console\.(log|error|warn|info|debug|table|group|groupCollapsed|groupEnd|clear|count|time|timeEnd)', re.IGNORECASE)
                    matches = console_pattern.findall(content)
                    
                    if matches:
                        lines_with_console = []
                        for i, line in enumerate(content.split('\n'), 1):
                            if console_pattern.search(line):
                                lines_with_console.append({
                                    "line_number": i,
                                    "content": line.strip(),
                                    "type": console_pattern.search(line).group(1) if console_pattern.search(line) else "unknown"
                                })
                        
                        file_info = {
                            "path": relative_path,
                            "full_path": file_path,
                            "console_count": len(matches),
                            "console_lines": lines_with_console,
                            "category": "uncategorized"
                        }
                        
                        # Categorize the file
                        for category, config in categories.items():
                            if category == "core_application":
                                # Special handling for core application
                                if any(pattern in relative_path for pattern in config["patterns"]):
                                    if not any(exclude in relative_path.lower() for exclude in config.get("exclude_patterns", [])):
                                        file_info["category"] = category
                                        config["files"].append(file_info)
                                        config["count"] += len(matches)
                                        break
                            else:
                                if any(pattern in relative_path.lower() for pattern in config["patterns"]):
                                    file_info["category"] = category
                                    config["files"].append(file_info)
                                    config["count"] += len(matches)
                                    break
                        
                        console_files.append(file_info)
                        
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")
                    continue
    
    # Generate summary report
    total_files = len(console_files)
    total_console_statements = sum(file_info["console_count"] for file_info in console_files)
    
    report = {
        "summary": {
            "total_files_with_console": total_files,
            "total_console_statements": total_console_statements,
            "categories": {}
        },
        "categories": categories,
        "detailed_files": console_files
    }
    
    # Add category summaries
    for category, config in categories.items():
        report["summary"]["categories"][category] = {
            "file_count": len(config["files"]),
            "console_count": config["count"],
            "strategy": config["strategy"]
        }
    
    return report

def main():
    # Run the analysis
    result = analyze_console_statements()
    
    print("📊 COMPREHENSIVE CONSOLE STATEMENT ANALYSIS")
    print("=" * 60)
    print(f"Total files with console statements: {result['summary']['total_files_with_console']}")
    print(f"Total console statements found: {result['summary']['total_console_statements']}")
    print()
    
    print("🏷️  CATEGORIZATION BREAKDOWN:")
    print("-" * 40)
    for category, data in result["summary"]["categories"].items():
        print(f"{category.upper().replace('_', ' ')}: {data['file_count']} files, {data['console_count']} statements")
        print(f"   Strategy: {data['strategy']}")
        print()
    
    print("📋 TOP FILES BY CONSOLE USAGE:")
    print("-" * 40)
    sorted_files = sorted(result["detailed_files"], key=lambda x: x["console_count"], reverse=True)
    for file_info in sorted_files[:15]:
        print(f"{file_info['path']} ({file_info['console_count']} statements) - {file_info['category']}")
    
    print("\n🎯 RECOMMENDED FIXING STRATEGY:")
    print("-" * 40)
    print("1. DEVELOPMENT/DEBUGGING FILES (eslint-disable):")
    print("   - Add /* eslint-disable no-console */ at file top")
    print("   - These are testing/validation files")
    
    print("\n2. CORE APPLICATION FILES (proper logging):")
    print("   - Replace console.* with proper logging system")
    print("   - Use structured logging with context")
    
    print("\n3. BUILD SCRIPTS (eslint-disable):")
    print("   - Add eslint-disable for build/config files")
    print("   - These need console output for build process")
    
    print("\n4. REMOVABLE FILES (remove):")
    print("   - Delete unnecessary console statements")
    print("   - Clean up temporary debug code")
    
    # Save detailed report
    with open('/Users/jeremyparker/Desktop/Claude Coding Projects/infinite-continue-stop-hook/console_analysis_report.json', 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"\n📁 Detailed report saved to: console_analysis_report.json")

if __name__ == "__main__":
    main()
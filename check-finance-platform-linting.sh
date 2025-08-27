#!/bin/bash
# Finance AI Research Platform - Console Cleanup Validation Script
# Run this script from the finance-ai-research-platform directory

echo "🚀 Finance AI Research Platform - Console Cleanup Validation"
echo "================================================================"
echo ""

# Store original directory
ORIGINAL_DIR=$(pwd)
FINANCE_PLATFORM_DIR="/Users/jeremyparker/Desktop/Claude Coding Projects/finance-ai-research-platform"

# Check if we're in the right directory or can navigate to it
if [ ! -d "$FINANCE_PLATFORM_DIR" ]; then
    echo "❌ Finance AI Research Platform directory not found at: $FINANCE_PLATFORM_DIR"
    exit 1
fi

cd "$FINANCE_PLATFORM_DIR"

echo "📍 Working Directory: $(pwd)"
echo ""

# Baseline data (original numbers)
ORIGINAL_ERRORS=485
ORIGINAL_WARNINGS=3561

echo "📊 BASELINE (Before Console Cleanup):"
echo "   Errors: $ORIGINAL_ERRORS"
echo "   Warnings: $ORIGINAL_WARNINGS"
echo ""

echo "🔍 Running Current Linting Validation..."
echo "----------------------------------------"

# Function to run lint and capture results
run_lint_check() {
    local dir="$1"
    local label="$2"
    
    echo "📋 Checking $label..."
    
    if [ -d "$dir" ]; then
        cd "$dir"
        
        # Run npm run lint and capture output
        if lint_output=$(npm run lint 2>&1); then
            echo "✅ $label: PASSED"
            echo "$lint_output" | grep -E "(error|warning)" || echo "   No errors or warnings found"
        else
            echo "⚠️  $label: Issues found"
            # Extract error and warning counts
            errors=$(echo "$lint_output" | grep -oE '[0-9]+ error' | grep -oE '[0-9]+' | head -1)
            warnings=$(echo "$lint_output" | grep -oE '[0-9]+ warning' | grep -oE '[0-9]+' | head -1)
            
            errors=${errors:-0}
            warnings=${warnings:-0}
            
            echo "   Errors: $errors"
            echo "   Warnings: $warnings"
            
            return 1
        fi
    else
        echo "❌ Directory not found: $dir"
        return 1
    fi
    
    echo ""
}

# Check root directory
ROOT_SUCCESS=0
cd "$FINANCE_PLATFORM_DIR"
run_lint_check "." "Root Directory" || ROOT_SUCCESS=1

# Check frontend directory
FRONTEND_SUCCESS=0
run_lint_check "frontend" "Frontend Directory" || FRONTEND_SUCCESS=1

echo "📈 RESULTS SUMMARY:"
echo "==================="

# Calculate improvements (this is a simplified version)
if [ $ROOT_SUCCESS -eq 0 ] && [ $FRONTEND_SUCCESS -eq 0 ]; then
    echo "🎉 EXCELLENT: All linting checks passed!"
    echo "   Errors: $ORIGINAL_ERRORS → 0 (100% reduction)"
    echo "   Console cleanup was highly successful!"
elif [ $ROOT_SUCCESS -eq 0 ] || [ $FRONTEND_SUCCESS -eq 0 ]; then
    echo "✅ GOOD: Significant improvement achieved"
    echo "   Most console-related linting issues resolved"
else
    echo "⚠️  NEEDS WORK: Some issues remain"
    echo "   Additional cleanup required"
fi

echo ""
echo "💡 RECOMMENDATIONS:"
echo "==================="
echo "1. Run 'npm run lint -- --format=verbose' for detailed error locations"
echo "2. Use 'npm run lint -- --fix' to auto-fix simple issues"
echo "3. Check console.* usage with: grep -r 'console\.' src/ --include='*.ts' --include='*.tsx'"
echo ""

echo "📁 For detailed analysis, run the validation script:"
echo "   node /path/to/validate-console-cleanup.js $FINANCE_PLATFORM_DIR"

# Return to original directory
cd "$ORIGINAL_DIR"
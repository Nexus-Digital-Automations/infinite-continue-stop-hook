# Research Task Guidelines and Configuration

## Overview

This file defines comprehensive guidelines for research tasks within the embedded subtasks system, including research methodologies, configuration standards, reporting requirements, and integration protocols.

## Research Task Framework

### 🔍 Research Task Definition

Research tasks are automatically generated for complex feature implementations requiring comprehensive analysis before development begins. They serve as critical intelligence-gathering phases that prevent implementation errors and ensure optimal technical approaches.

### Core Research Principles

1. **Comprehensive Analysis**: Cover all relevant technical, architectural, and business aspects
2. **Multi-Source Investigation**: Combine codebase analysis, internet research, and documentation review
3. **Objective Assessment**: Provide unbiased analysis of options and approaches
4. **Implementation-Ready Deliverables**: Generate actionable insights for implementation teams
5. **Risk Mitigation**: Identify potential issues and challenges before implementation

## Research Location Configuration

### 🏗️ Codebase Research

```json
{
  "type": "codebase",
  "configuration": {
    "primary_paths": ["/src", "/lib", "/api", "/routes", "/controllers", "/models", "/services", "/components"],
    "secondary_paths": ["/config", "/utils", "/helpers", "/middleware", "/schemas"],
    "analysis_focus": [
      "Existing implementation patterns",
      "Architectural decisions and conventions",
      "Data flow and integration points",
      "Error handling strategies",
      "Performance optimization patterns",
      "Security implementation approaches"
    ],
    "tools": [
      "Grep for pattern analysis",
      "Read for detailed code inspection",
      "Glob for file discovery",
      "Bash for dependency analysis"
    ]
  }
}
```

### 🌐 Internet Research

```json
{
  "type": "internet",
  "configuration": {
    "search_strategies": [
      "Best practices and industry standards",
      "Technical specifications and documentation",
      "Performance benchmarks and optimizations",
      "Security considerations and vulnerabilities",
      "Integration patterns and compatibility",
      "Alternative approaches and trade-offs"
    ],
    "preferred_sources": [
      "Official documentation",
      "Technical blogs and articles",
      "Stack Overflow and community forums",
      "GitHub repositories and examples",
      "Academic papers and research",
      "Industry reports and case studies"
    ],
    "keyword_generation": {
      "primary": "Extract from task title and description",
      "technical": "Technology-specific terms and frameworks",
      "contextual": "Problem domain and use case specific",
      "comparative": "Alternative solutions and approaches"
    }
  }
}
```

### 📚 Documentation Research

```json
{
  "type": "documentation",
  "configuration": {
    "internal_sources": [
      "README.md",
      "CLAUDE.md",
      "development/essentials/",
      "development/architecture-specs/",
      "API documentation files",
      "package.json and dependencies"
    ],
    "external_sources": [
      "Framework documentation",
      "Library API references",
      "Protocol specifications",
      "Standards documentation"
    ],
    "analysis_objectives": [
      "Project configuration and constraints",
      "Existing documentation patterns",
      "API contracts and interfaces",
      "Dependency requirements and compatibility"
    ]
  }
}
```

## Research Task Templates

### Standard Research Task Template

```json
{
  "id": "research_[timestamp]_[random]",
  "type": "research",
  "title": "Research: [Original Task Title]",
  "description": "Comprehensive research for [original task description] to support implementation",
  "status": "pending",
  "estimated_hours": 1,
  "research_locations": [
    {
      "type": "codebase",
      "paths": ["auto-generated based on task context"],
      "focus": "Existing implementation patterns and architecture"
    },
    {
      "type": "internet",
      "keywords": ["auto-extracted from task description"],
      "focus": "Best practices, industry standards, and technical specifications"
    },
    {
      "type": "documentation",
      "sources": ["README.md", "docs/", "API documentation", "package.json"],
      "focus": "Project configuration and existing documentation"
    }
  ],
  "deliverables": [
    "Technical analysis report",
    "Implementation recommendations",
    "Risk assessment",
    "Alternative approaches evaluation"
  ],
  "prevents_implementation": true,
  "created_at": "[ISO timestamp]"
}
```

### Complex Research Task Template

```json
{
  "id": "research_[timestamp]_[random]",
  "type": "research",
  "title": "Research: [Complex Feature Title]",
  "description": "Comprehensive multi-phase research for [complex feature description]",
  "status": "pending",
  "estimated_hours": 2,
  "research_phases": [
    {
      "phase": 1,
      "title": "Architecture Analysis",
      "focus": "Current system architecture and integration points",
      "deliverables": ["Architecture assessment", "Integration analysis"]
    },
    {
      "phase": 2,
      "title": "Technology Research",
      "focus": "Technology options and implementation approaches",
      "deliverables": ["Technology comparison", "Implementation strategies"]
    },
    {
      "phase": 3,
      "title": "Risk and Implementation Planning",
      "focus": "Risk assessment and detailed implementation roadmap",
      "deliverables": ["Risk assessment", "Implementation plan"]
    }
  ],
  "research_locations": "[enhanced multi-source configuration]",
  "prevents_implementation": true
}
```

## Research Execution Guidelines

### 🎯 Research Methodology

1. **Systematic Approach**: Follow structured methodology for comprehensive coverage
2. **Documentation-First**: Document findings as research progresses
3. **Evidence-Based**: Support conclusions with concrete evidence and examples
4. **Implementation-Focused**: Ensure research directly supports implementation decisions

### Research Execution Sequence

```bash
# Phase 1: Codebase Analysis
grep -r "relevant_patterns" src/ lib/ api/
find . -name "*related*" -type f
read important_files_identified

# Phase 2: Documentation Review
read README.md CLAUDE.md package.json
find development/ -name "*.md" -exec read {} \;

# Phase 3: Internet Research
websearch "best practices for [technology/approach]"
websearch "[technology] implementation patterns"
websearch "[technology] security considerations"

# Phase 4: Analysis and Synthesis
# Combine findings into comprehensive report
```

### Research Quality Standards

- **Completeness**: Cover all relevant aspects of the research topic
- **Accuracy**: Verify information from multiple sources
- **Relevance**: Focus on information directly applicable to implementation
- **Objectivity**: Present balanced view of options and trade-offs
- **Actionability**: Provide specific, implementable recommendations

## Research Deliverables Framework

### 📋 Technical Analysis Report

```markdown
# Technical Analysis Report

## Executive Summary

- Brief overview of research objectives and key findings
- Primary recommendations for implementation approach
- Critical risk factors and mitigation strategies

## Current State Analysis

- Existing system architecture and capabilities
- Current implementation patterns and conventions
- Integration points and dependencies
- Identified gaps and opportunities

## Technology Research

- Available technology options and frameworks
- Comparative analysis of approaches
- Performance and scalability considerations
- Security and compliance implications

## Implementation Recommendations

- Recommended approach with rationale
- Alternative approaches with trade-offs
- Specific implementation steps and considerations
- Required resources and dependencies

## Risk Assessment

- Technical risks and mitigation strategies
- Implementation challenges and solutions
- Performance and scalability risks
- Security and compliance risks

## Conclusion

- Summary of key recommendations
- Next steps for implementation team
- Success criteria and validation approaches
```

### 🎯 Implementation Recommendations Template

```json
{
  "implementation_recommendations": {
    "primary_approach": {
      "technology": "Recommended technology/framework",
      "rationale": "Why this approach is recommended",
      "implementation_steps": ["Step 1", "Step 2", "Step 3"],
      "estimated_effort": "Implementation time estimate",
      "risk_level": "Low/Medium/High"
    },
    "alternative_approaches": [
      {
        "technology": "Alternative option",
        "pros": ["Advantage 1", "Advantage 2"],
        "cons": ["Disadvantage 1", "Disadvantage 2"],
        "use_case": "When this approach might be preferred"
      }
    ],
    "implementation_considerations": {
      "performance": "Performance implications and optimizations",
      "security": "Security considerations and requirements",
      "maintainability": "Long-term maintenance considerations",
      "scalability": "Scalability limitations and enhancements"
    }
  }
}
```

### ⚠️ Risk Assessment Framework

```json
{
  "risk_assessment": {
    "technical_risks": [
      {
        "risk": "Description of technical risk",
        "probability": "Low/Medium/High",
        "impact": "Low/Medium/High",
        "mitigation": "Specific mitigation strategy"
      }
    ],
    "implementation_risks": [
      {
        "risk": "Implementation challenge",
        "probability": "Low/Medium/High",
        "impact": "Low/Medium/High",
        "mitigation": "Approach to address challenge"
      }
    ],
    "business_risks": [
      {
        "risk": "Business or operational risk",
        "probability": "Low/Medium/High",
        "impact": "Low/Medium/High",
        "mitigation": "Business mitigation strategy"
      }
    ]
  }
}
```

## Research Agent Specialization

### 🔬 Research Agent Roles

- **Technology Research Specialist**: Focus on technology evaluation and comparison
- **Architecture Research Specialist**: Focus on system architecture and integration
- **Security Research Specialist**: Focus on security implications and best practices
- **Performance Research Specialist**: Focus on performance optimization and scalability

### Research Agent Assignment Rules

1. **Complex Features**: Assign specialized research agents based on feature complexity
2. **Multi-Disciplinary Features**: Use multiple research agents for comprehensive coverage
3. **Time-Critical Features**: Prioritize research agents with relevant specialization
4. **Independent Research**: Research agents must be independent of implementation agents

## Research Report Management

### 📁 Report Organization

```
development/research-reports/
├── task_[taskId]/
│   ├── research-report.md          # Main research findings
│   ├── technical-analysis.md       # Detailed technical analysis
│   ├── implementation-plan.md      # Specific implementation guidance
│   ├── risk-assessment.md          # Comprehensive risk analysis
│   ├── references/                 # Supporting materials and links
│   └── artifacts/                  # Code examples, diagrams, etc.
```

### Report Naming Conventions

- **Main Report**: `research-report-task_[taskId].md`
- **Specialized Reports**: `[specialty]-analysis-task_[taskId].md`
- **Implementation Plans**: `implementation-plan-task_[taskId].md`
- **Risk Assessments**: `risk-assessment-task_[taskId].md`

### Report Metadata

```json
{
  "report_metadata": {
    "research_task_id": "research_1234567890_abcdef",
    "parent_task_id": "feature_1234567890_abcdef",
    "research_agent": "research_session_xyz",
    "research_duration": "2 hours",
    "research_date": "2025-09-13",
    "research_scope": ["codebase", "internet", "documentation"],
    "confidence_level": "High/Medium/Low",
    "completeness": "100%"
  }
}
```

## Integration with Implementation

### 🔄 Research-Implementation Handoff

1. **Research Completion**: Research task marked complete with comprehensive report
2. **Implementation Preparation**: Implementation agent reviews research deliverables
3. **Implementation Planning**: Implementation approach based on research recommendations
4. **Continuous Reference**: Research reports referenced throughout implementation
5. **Validation**: Implementation validated against research recommendations

### Implementation Validation Criteria

- **Follows Recommendations**: Implementation aligns with research recommendations
- **Addresses Risks**: Identified risks are properly mitigated
- **Meets Quality Standards**: Implementation meets quality standards identified in research
- **Performance Targets**: Achieves performance targets identified in research

## Research Quality Assurance

### 🔍 Research Validation

- **Peer Review**: Research findings reviewed by other research agents
- **Source Verification**: All sources and references validated
- **Completeness Check**: All research objectives covered
- **Accuracy Validation**: Technical claims verified through multiple sources

### Research Metrics

- **Coverage**: Percentage of research objectives completed
- **Source Diversity**: Number of different source types consulted
- **Recommendation Confidence**: Confidence level in primary recommendations
- **Implementation Success**: Success rate of implementations based on research

_Created: 2025-09-13 by Configuration Agent #8_
_Version: 1.0.0_

# StoryMine Development Standards: Ephemeral Files Policy

## Overview

This document establishes clear policies for managing temporary files, scripts, and experimental code within the StoryMine project. These policies ensure clean, maintainable codebases and prevent accumulation of unnecessary or obsolete files.

## Core Principles

### 1. No Ephemeral Files in Source Control
- **Temporary scripts, test files, or experimental code should not be committed**
- **Every file in the repository should serve a clear, documented purpose**
- **Before creating any new file, check if existing functionality can be extended**

### 2. File Purpose Documentation
- **Every script or utility must have a clear header comment explaining its purpose**
- **Include author, creation date, and intended usage**
- **Document when the file should be removed (if temporary)**

### 3. Clean Development Practices
- **Prefer editing existing files over creating new ones**
- **Delete temporary files immediately after use**
- **Use descriptive names that indicate the file's role and scope**

## File Categories

### ✅ **Acceptable Files**
- **Core application code** (src/, backend/, frontend/)
- **Configuration files** (package.json, Dockerfile, etc.)
- **Documentation** (README.md, API docs)
- **Deployment scripts** (production deployment, setup scripts)
- **Database schema and migrations**
- **Tests and test fixtures**

### ❌ **Prohibited Files**
- **Temporary test scripts** (test_*.py, temp_*.js, etc.)
- **Debug output files** (debug.log, temp.txt, etc.)
- **Personal experiment files** (my_test.py, scratch.js, etc.)
- **Duplicate functionality** (multiple scripts doing the same thing)
- **Commented-out code files** (old_version.py, backup_*.js, etc.)

### ⚠️ **Conditional Files** (Require Justification)
- **Utility scripts** - Must be documented and actively used
- **Data processing scripts** - Must be part of established workflows
- **Diagnostic tools** - Must serve ongoing operational needs

## Implementation Guidelines

### Before Creating New Files
1. **Search existing codebase** - Is there existing functionality you can extend?
2. **Check for similar scripts** - Avoid duplicating existing capabilities
3. **Consider the file's lifecycle** - Is this permanent or temporary?
4. **Plan for maintenance** - Who will update this file as the project evolves?

### File Header Requirements
Every script or utility file must include:

```javascript
/**
 * File: [filename]
 * Purpose: [Clear description of what this file does]
 * Author: [Author name]
 * Created: [Date]
 * Last Modified: [Date]
 * Usage: [How to use this file]
 * Dependencies: [Any requirements or prerequisites]
 * Status: [Active/Deprecated/Temporary]
 */
```

### Cleanup Procedures

#### Weekly Cleanup
- **Review all files in /scripts directory**
- **Remove any temporary or experimental files**
- **Update documentation for modified files**
- **Check for unused imports or dependencies**

#### Before Major Releases
- **Audit entire codebase for unnecessary files**
- **Remove commented-out code sections**
- **Consolidate duplicate functionality**
- **Update all file headers and documentation**

## Directory-Specific Policies

### `/scripts/` Directory
- **Only production-ready utilities**
- **Each script must have clear documentation**
- **Remove any one-off or experimental scripts**
- **Consolidate similar functionality**

### `/src/` Directory
- **Core application code only**
- **No temporary test files**
- **No experimental features unless properly integrated**

### `/docs/` Directory
- **Current, accurate documentation only**
- **Remove outdated or superseded documents**
- **Maintain clear version history**

### Root Directory
- **Essential configuration files only**
- **No temporary or backup files**
- **Clear naming conventions**

## Common Violations and Solutions

### Problem: Multiple Similar Scripts
**Violation**: Having `test_database.js`, `db_test.py`, `check_db.js` all doing similar things
**Solution**: Create one comprehensive database diagnostic tool with clear documentation

### Problem: Temporary Files Left Behind
**Violation**: Files like `temp_fix.py`, `quick_test.js`, `debug_output.txt`
**Solution**: Delete immediately after use, or integrate into proper tooling

### Problem: Experimental Code in Production
**Violation**: Half-finished features or experimental branches in main codebase
**Solution**: Use feature branches, clean up before merging

### Problem: Undefined File Purpose
**Violation**: Files with unclear names like `script.py`, `test.js`, `util.py`
**Solution**: Use descriptive names and add proper documentation headers

## Enforcement

### Code Review Process
- **All new files must be justified during code review**
- **Check for proper documentation and naming**
- **Verify the file serves a clear, ongoing purpose**
- **Ensure no duplicate functionality is being created**

### Automated Checks
- **Git hooks to warn about common temporary file patterns**
- **Regular automated scans for files lacking proper headers**
- **Dependency analysis to identify unused files**

### Developer Responsibility
- **Each developer is responsible for cleaning up their temporary files**
- **Before pushing changes, verify no ephemeral files are included**
- **Regularly review and clean your working directory**

## Examples

### ✅ Good File Structure
```
src/
├── backend/
│   ├── controllers/
│   ├── services/
│   └── tests/
├── frontend/
│   ├── components/
│   └── pages/
scripts/
├── deploy-railway.sh
├── setup-database.sql
└── monitor-health.js
```

### ❌ Bad File Structure
```
src/
├── temp_test.py
├── debug.js
├── my_experiment.py
└── old_backup_file.js
scripts/
├── test.py
├── temp.js
├── quick_fix.py
└── debug_stuff.js
```

## Migration Strategy

### For Existing Ephemeral Files
1. **Identify the file's current purpose**
2. **Determine if functionality should be preserved**
3. **If valuable, integrate into proper tooling with documentation**
4. **If temporary, delete immediately**
5. **If uncertain, move to a temporary review directory for evaluation**

### For Legacy Code Cleanup
1. **Create inventory of all existing files**
2. **Categorize by purpose and importance**
3. **Remove obvious temporary/debug files**
4. **Consolidate duplicate functionality**
5. **Update documentation for remaining files**

## Conclusion

Maintaining clean codebases requires discipline and clear policies. By following these guidelines, the StoryMine project ensures that every file serves a clear purpose, is properly documented, and contributes to the overall maintainability and professionalism of the codebase.

**Remember**: When in doubt, delete it. If it's important, it should be properly documented and integrated. If it's temporary, it shouldn't be in version control. 
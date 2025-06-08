#!/usr/bin/env node

/**
 * Master Diagnostics Runner
 * 
 * Runs all monitoring and testing scripts to provide comprehensive
 * system health assessment for StoryMine.
 * 
 * Usage:
 *   node scripts/run_all_diagnostics.js [--verbose] [--continuous] [--report-only]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  verbose: process.argv.includes('--verbose'),
  continuous: process.argv.includes('--continuous'),
  reportOnly: process.argv.includes('--report-only'),
  interval: 5 * 60 * 1000, // 5 minutes for continuous mode
  logFile: path.join(__dirname, '../logs/master_diagnostics.log'),
  reportFile: path.join(__dirname, '../logs/system_health_report.json')
};

// Ensure logs directory exists
const logsDir = path.dirname(config.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (config.verbose || level === 'ERROR' || level === 'SUMMARY') {
    console.log(logLine);
    if (data && config.verbose) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }
  
  try {
    fs.appendFileSync(config.logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    log('INFO', `Starting ${path.basename(scriptPath)}...`);
    
    const child = spawn('node', [scriptPath, ...args], {
      stdio: config.verbose ? 'inherit' : 'pipe',
      cwd: path.dirname(scriptPath)
    });
    
    let stdout = '';
    let stderr = '';
    
    if (!config.verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        log('INFO', `${path.basename(scriptPath)} completed successfully`, {
          duration,
          exitCode: code
        });
        resolve({
          script: path.basename(scriptPath),
          success: true,
          duration,
          exitCode: code,
          stdout: stdout.slice(-1000), // Last 1000 chars
          stderr: stderr.slice(-1000)
        });
      } else {
        log('ERROR', `${path.basename(scriptPath)} failed`, {
          duration,
          exitCode: code,
          stderr: stderr.slice(-500)
        });
        resolve({
          script: path.basename(scriptPath),
          success: false,
          duration,
          exitCode: code,
          stdout: stdout.slice(-1000),
          stderr: stderr.slice(-1000)
        });
      }
    });
    
    child.on('error', (error) => {
      log('ERROR', `Failed to start ${path.basename(scriptPath)}`, {
        error: error.message
      });
      reject(error);
    });
  });
}

async function runDatabaseTests() {
  log('INFO', '🔍 Running database tests...');
  
  const tests = [
    {
      name: 'Database Connectivity Monitor',
      script: path.join(__dirname, 'monitor_database_connectivity.js'),
      args: ['--interval=0'] // Single run
    },
    {
      name: 'Database Operations Test',
      script: path.join(__dirname, 'test_database_operations.js'),
      args: config.verbose ? ['--verbose'] : []
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await runScript(test.script, test.args);
      results.push({
        ...result,
        testName: test.name
      });
    } catch (error) {
      results.push({
        script: path.basename(test.script),
        testName: test.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

async function checkApplicationHealth() {
  log('INFO', '🌐 Checking application health...');
  
  const healthChecks = [];
  
  // Check if Railway deployment exists
  try {
    const { exec } = require('child_process');
    const checkRailway = () => new Promise((resolve) => {
      exec('railway status', (error, stdout, stderr) => {
        if (error) {
          healthChecks.push({
            check: 'Railway Status',
            success: false,
            error: error.message
          });
        } else {
          healthChecks.push({
            check: 'Railway Status',
            success: true,
            output: stdout.slice(0, 200)
          });
        }
        resolve();
      });
    });
    
    await checkRailway();
  } catch (error) {
    healthChecks.push({
      check: 'Railway Status',
      success: false,
      error: 'Railway CLI not available'
    });
  }
  
  // Check if logs directory exists and is writable
  try {
    const testFile = path.join(logsDir, 'write-test.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    healthChecks.push({
      check: 'Logs Directory',
      success: true,
      path: logsDir
    });
  } catch (error) {
    healthChecks.push({
      check: 'Logs Directory',
      success: false,
      error: error.message
    });
  }
  
  // Check script dependencies
  const requiredScripts = [
    'monitor_database_connectivity.js',
    'test_database_operations.js'
  ];
  
  for (const script of requiredScripts) {
    const scriptPath = path.join(__dirname, script);
    healthChecks.push({
      check: `Script: ${script}`,
      success: fs.existsSync(scriptPath),
      path: scriptPath
    });
  }
  
  return healthChecks;
}

async function generateSystemReport() {
  log('INFO', '📊 Generating system health report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    storyMineVersion: '1.2.0',
    diagnosticsVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    summary: {
      overallHealth: 'unknown',
      criticalIssues: 0,
      warnings: 0,
      successfulTests: 0,
      totalTests: 0
    },
    databaseTests: [],
    applicationHealth: [],
    recommendations: []
  };
  
  try {
    // Run database tests
    report.databaseTests = await runDatabaseTests();
    
    // Check application health
    report.applicationHealth = await checkApplicationHealth();
    
    // Calculate summary
    const allTests = [...report.databaseTests, ...report.applicationHealth];
    report.summary.totalTests = allTests.length;
    report.summary.successfulTests = allTests.filter(t => t.success).length;
    
    const criticalIssues = report.databaseTests.filter(t => !t.success).length;
    const warnings = report.applicationHealth.filter(t => !t.success).length;
    
    report.summary.criticalIssues = criticalIssues;
    report.summary.warnings = warnings;
    
    // Determine overall health
    if (criticalIssues === 0 && warnings === 0) {
      report.summary.overallHealth = 'excellent';
    } else if (criticalIssues === 0 && warnings <= 2) {
      report.summary.overallHealth = 'good';
    } else if (criticalIssues <= 1) {
      report.summary.overallHealth = 'degraded';
    } else {
      report.summary.overallHealth = 'critical';
    }
    
    // Generate recommendations
    if (criticalIssues > 0) {
      report.recommendations.push('CRITICAL: Database connectivity issues detected. Run database diagnostics immediately.');
    }
    
    if (warnings > 2) {
      report.recommendations.push('WARNING: Multiple application health issues detected. Review system configuration.');
    }
    
    if (report.summary.overallHealth === 'excellent') {
      report.recommendations.push('System is healthy. Continue regular monitoring.');
    }
    
    // Save report
    fs.writeFileSync(config.reportFile, JSON.stringify(report, null, 2));
    
    log('SUMMARY', `System Health Report Generated`, {
      overallHealth: report.summary.overallHealth,
      successRate: `${report.summary.successfulTests}/${report.summary.totalTests}`,
      criticalIssues,
      warnings,
      reportPath: config.reportFile
    });
    
    return report;
    
  } catch (error) {
    log('ERROR', 'Failed to generate system report', { error: error.message });
    report.summary.overallHealth = 'critical';
    report.recommendations.push('CRITICAL: System diagnostics failed. Manual intervention required.');
    return report;
  }
}

async function runContinuousMonitoring() {
  log('INFO', '🔄 Starting continuous monitoring mode...');
  log('INFO', `Monitoring interval: ${config.interval / 1000} seconds`);
  
  const runDiagnostics = async () => {
    try {
      const report = await generateSystemReport();
      
      if (report.summary.overallHealth === 'critical') {
        log('ALERT', '🚨 CRITICAL SYSTEM ISSUES DETECTED!', {
          criticalIssues: report.summary.criticalIssues,
          recommendations: report.recommendations
        });
      }
      
    } catch (error) {
      log('ERROR', 'Continuous monitoring cycle failed', { error: error.message });
    }
  };
  
  // Initial run
  await runDiagnostics();
  
  // Set up interval
  const intervalId = setInterval(runDiagnostics, config.interval);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('INFO', 'Stopping continuous monitoring...');
    clearInterval(intervalId);
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('INFO', 'Continuous monitoring terminated');
    clearInterval(intervalId);
    process.exit(0);
  });
  
  // Keep process alive
  process.stdin.resume();
}

async function main() {
  const startTime = Date.now();
  
  log('INFO', '🚀 StoryMine Master Diagnostics Starting...', {
    version: '1.0.0',
    mode: config.continuous ? 'continuous' : 'single-run',
    verbose: config.verbose,
    reportOnly: config.reportOnly
  });
  
  try {
    if (config.continuous) {
      await runContinuousMonitoring();
    } else {
      const report = await generateSystemReport();
      
      const duration = Date.now() - startTime;
      log('SUMMARY', '🏁 Master diagnostics completed', {
        duration,
        overallHealth: report.summary.overallHealth,
        successRate: `${report.summary.successfulTests}/${report.summary.totalTests}`,
        reportFile: config.reportFile
      });
      
      // Exit with appropriate code
      if (report.summary.overallHealth === 'critical') {
        process.exit(1);
      } else if (report.summary.overallHealth === 'degraded') {
        process.exit(2);
      } else {
        process.exit(0);
      }
    }
    
  } catch (error) {
    log('ERROR', 'Master diagnostics failed', { error: error.message });
    process.exit(1);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
StoryMine Master Diagnostics Runner

Usage:
  node scripts/run_all_diagnostics.js [options]

Options:
  --verbose      Show detailed output from all tests
  --continuous   Run continuously with 5-minute intervals  
  --report-only  Generate report without running tests
  --help, -h     Show this help message

Examples:
  # Single comprehensive health check
  node scripts/run_all_diagnostics.js

  # Verbose single run
  node scripts/run_all_diagnostics.js --verbose

  # Continuous monitoring (Ctrl+C to stop)
  node scripts/run_all_diagnostics.js --continuous

  # Continuous with verbose output
  node scripts/run_all_diagnostics.js --continuous --verbose

Output:
  - Logs: logs/master_diagnostics.log
  - Report: logs/system_health_report.json
  - Console: Summary and errors

Exit Codes:
  0 - Excellent/Good health
  1 - Critical issues detected
  2 - Degraded health
`);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log('ERROR', 'Unexpected error in main()', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  runDatabaseTests,
  checkApplicationHealth, 
  generateSystemReport
}; 
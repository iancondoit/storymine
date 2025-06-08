#!/usr/bin/env node

/**
 * Database Connectivity Monitor
 * 
 * Continuously monitors AWS RDS PostgreSQL connection health
 * Logs issues, sends alerts, and provides detailed diagnostics
 * 
 * Usage:
 *   node scripts/monitor_database_connectivity.js [--interval=30] [--verbose]
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  interval: parseInt(process.argv.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 30, // seconds
  verbose: process.argv.includes('--verbose'),
  logFile: path.join(__dirname, '../logs/database_monitoring.log'),
  alertThreshold: 3, // consecutive failures before alert
  timeout: 10000 // 10 second timeout
};

// Ensure logs directory exists
const logsDir = path.dirname(config.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Database configuration from environment
const dbConfig = {
  host: process.env.DATABASE_HOST || 'storymap-intelligence-database.c123abc456def.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'storymap_intelligence',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: config.timeout,
  query_timeout: config.timeout,
  statement_timeout: config.timeout,
  idle_in_transaction_session_timeout: config.timeout
};

// Monitoring state
let consecutiveFailures = 0;
let lastSuccessTime = null;
let monitoringStartTime = new Date();

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    consecutiveFailures,
    lastSuccessTime,
    uptime: Date.now() - monitoringStartTime.getTime()
  };
  
  const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  // Console output
  if (config.verbose || level === 'ERROR' || level === 'ALERT') {
    console.log(logLine);
    if (data) console.log('  Data:', JSON.stringify(data, null, 2));
  }
  
  // File logging
  try {
    fs.appendFileSync(config.logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err.message);
  }
}

async function testBasicConnection() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    await client.end();
    
    return {
      success: true,
      currentTime: result.rows[0].current_time,
      postgresVersion: result.rows[0].postgres_version,
      responseTime: Date.now()
    };
  } catch (error) {
    try { await client.end(); } catch {}
    return {
      success: false,
      error: error.message,
      code: error.code,
      errno: error.errno
    };
  }
}

async function testDataIntegrity() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // Check core tables exist and have expected data
    const checks = [
      {
        name: 'intelligence_articles',
        query: 'SELECT COUNT(*) as count FROM intelligence_articles LIMIT 1',
        expectedMin: 200000
      },
      {
        name: 'intelligence_entities', 
        query: 'SELECT COUNT(*) as count FROM intelligence_entities LIMIT 1',
        expectedMin: 1000000
      },
      {
        name: 'intelligence_relationships',
        query: 'SELECT COUNT(*) as count FROM intelligence_relationships LIMIT 1', 
        expectedMin: 1000000
      }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        const result = await client.query(check.query);
        const count = parseInt(result.rows[0].count);
        results[check.name] = {
          count,
          healthy: count >= check.expectedMin,
          expectedMin: check.expectedMin
        };
      } catch (error) {
        results[check.name] = {
          error: error.message,
          healthy: false
        };
      }
    }
    
    await client.end();
    
    const allHealthy = Object.values(results).every(r => r.healthy);
    
    return {
      success: true,
      healthy: allHealthy,
      tables: results
    };
    
  } catch (error) {
    try { await client.end(); } catch {}
    return {
      success: false,
      error: error.message
    };
  }
}

async function testPerformance() {
  const client = new Client(dbConfig);
  const startTime = Date.now();
  
  try {
    await client.connect();
    const connectTime = Date.now() - startTime;
    
    const queryStart = Date.now();
    await client.query('SELECT COUNT(*) FROM intelligence_articles WHERE created_at > NOW() - INTERVAL \'1 day\'');
    const queryTime = Date.now() - queryStart;
    
    await client.end();
    
    return {
      success: true,
      connectTime,
      queryTime,
      totalTime: Date.now() - startTime
    };
    
  } catch (error) {
    try { await client.end(); } catch {}
    return {
      success: false,
      error: error.message,
      totalTime: Date.now() - startTime
    };
  }
}

async function runHealthCheck() {
  const checkStartTime = Date.now();
  
  log('INFO', 'Starting health check...');
  
  // Test 1: Basic Connection
  const basicTest = await testBasicConnection();
  if (!basicTest.success) {
    consecutiveFailures++;
    log('ERROR', 'Basic connection failed', basicTest);
    
    if (consecutiveFailures >= config.alertThreshold) {
      log('ALERT', `Database connection failed ${consecutiveFailures} consecutive times!`, {
        lastSuccessTime,
        failureThreshold: config.alertThreshold
      });
    }
    return;
  }
  
  // Test 2: Data Integrity
  const integrityTest = await testDataIntegrity();
  if (!integrityTest.success || !integrityTest.healthy) {
    consecutiveFailures++;
    log('ERROR', 'Data integrity check failed', integrityTest);
    return;
  }
  
  // Test 3: Performance
  const performanceTest = await testPerformance();
  if (!performanceTest.success) {
    log('WARN', 'Performance test failed', performanceTest);
  }
  
  // All tests passed
  consecutiveFailures = 0;
  lastSuccessTime = new Date().toISOString();
  
  const checkDuration = Date.now() - checkStartTime;
  
  log('INFO', 'Health check completed successfully', {
    basicConnection: basicTest,
    dataIntegrity: integrityTest,
    performance: performanceTest,
    checkDuration
  });
  
  // Log performance warnings
  if (performanceTest.success) {
    if (performanceTest.connectTime > 5000) {
      log('WARN', `Slow connection time: ${performanceTest.connectTime}ms`);
    }
    if (performanceTest.queryTime > 10000) {
      log('WARN', `Slow query time: ${performanceTest.queryTime}ms`);
    }
  }
}

async function generateHealthReport() {
  const reportPath = path.join(__dirname, '../logs/database_health_report.json');
  
  try {
    const logContent = fs.readFileSync(config.logFile, 'utf8');
    const logs = logContent.trim().split('\n').map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() > last24Hours);
    
    const errors = recentLogs.filter(log => log.level === 'ERROR');
    const alerts = recentLogs.filter(log => log.level === 'ALERT');
    const successes = recentLogs.filter(log => log.level === 'INFO' && log.message.includes('completed successfully'));
    
    const uptime = successes.length > 0 ? (successes.length / (successes.length + errors.length)) * 100 : 0;
    
    const report = {
      generatedAt: new Date().toISOString(),
      monitoringPeriod: '24 hours',
      summary: {
        totalChecks: recentLogs.length,
        successfulChecks: successes.length,
        errors: errors.length,
        alerts: alerts.length,
        uptimePercentage: uptime.toFixed(2)
      },
      lastSuccess: lastSuccessTime,
      consecutiveFailures,
      recentErrors: errors.slice(-5),
      recentAlerts: alerts.slice(-3)
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log('INFO', `Health report generated: ${reportPath}`);
    
  } catch (error) {
    log('ERROR', 'Failed to generate health report', { error: error.message });
  }
}

// Signal handlers for graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Monitoring stopped by user');
  generateHealthReport();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('INFO', 'Monitoring terminated');
  generateHealthReport();
  process.exit(0);
});

// Main monitoring loop
async function startMonitoring() {
  log('INFO', 'Database connectivity monitoring started', {
    interval: config.interval,
    verbose: config.verbose,
    alertThreshold: config.alertThreshold,
    databaseHost: dbConfig.host,
    databaseName: dbConfig.database
  });
  
  // Initial health check
  await runHealthCheck();
  
  // Set up periodic checks
  const intervalId = setInterval(async () => {
    await runHealthCheck();
  }, config.interval * 1000);
  
  // Generate daily reports
  const reportInterval = setInterval(() => {
    generateHealthReport();
  }, 24 * 60 * 60 * 1000); // Every 24 hours
  
  // Keep process alive
  process.on('exit', () => {
    clearInterval(intervalId);
    clearInterval(reportInterval);
  });
}

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring().catch(error => {
    log('ERROR', 'Failed to start monitoring', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  testBasicConnection,
  testDataIntegrity,
  testPerformance,
  runHealthCheck,
  generateHealthReport
}; 
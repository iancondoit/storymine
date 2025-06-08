#!/usr/bin/env node

/**
 * Database Operations Test Suite
 * 
 * Tests all database operations used by StoryMine to ensure AWS connectivity
 * and data integrity for all application features.
 * 
 * Usage:
 *   node scripts/test_database_operations.js [--verbose] [--fix-issues]
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  verbose: process.argv.includes('--verbose'),
  fixIssues: process.argv.includes('--fix-issues'),
  timeout: 30000, // 30 second timeout for complex queries
  logFile: path.join(__dirname, '../logs/database_operations_test.log')
};

// Database configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'storymap-intelligence-database.c123abc456def.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'storymap_intelligence',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: config.timeout,
  query_timeout: config.timeout
};

// Ensure logs directory exists
const logsDir = path.dirname(config.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(level, test, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    test,
    message,
    data
  };
  
  const logLine = `[${timestamp}] ${level.toUpperCase()} [${test}]: ${message}`;
  
  if (config.verbose || level === 'ERROR' || level === 'PASS' || level === 'FAIL') {
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

async function createTestClient() {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

// Test 1: Database Stats API (used by homepage)
async function testDatabaseStats() {
  const client = await createTestClient();
  
  try {
    log('INFO', 'DATABASE_STATS', 'Testing database statistics query...');
    
    // Test intelligence tables (current implementation)
    const intelligenceQuery = `
      SELECT 
        (SELECT COUNT(*) FROM intelligence_articles) as articles,
        (SELECT COUNT(*) FROM intelligence_entities) as entities,
        (SELECT COUNT(*) FROM intelligence_relationships) as relationships,
        (SELECT MIN(EXTRACT(YEAR FROM created_at)) FROM intelligence_articles) as earliest_year,
        (SELECT MAX(EXTRACT(YEAR FROM created_at)) FROM intelligence_articles) as latest_year
    `;
    
    const result = await client.query(intelligenceQuery);
    const stats = result.rows[0];
    
    // Validate expected data ranges
    const expectations = {
      articles: { min: 200000, max: 500000 },
      entities: { min: 1000000, max: 2000000 },
      relationships: { min: 1000000, max: 2000000 },
      earliest_year: { min: 1900, max: 1950 },
      latest_year: { min: 1950, max: 2000 }
    };
    
    let allValid = true;
    const validationResults = {};
    
    for (const [field, range] of Object.entries(expectations)) {
      const value = parseInt(stats[field]);
      const valid = value >= range.min && value <= range.max;
      validationResults[field] = { value, valid, expected: range };
      if (!valid) allValid = false;
    }
    
    if (allValid) {
      log('PASS', 'DATABASE_STATS', 'Database statistics are within expected ranges', {
        stats: stats,
        validation: validationResults
      });
    } else {
      log('FAIL', 'DATABASE_STATS', 'Database statistics are outside expected ranges', {
        stats: stats,
        validation: validationResults
      });
    }
    
    await client.end();
    return { success: allValid, stats, validation: validationResults };
    
  } catch (error) {
    await client.end();
    log('ERROR', 'DATABASE_STATS', 'Database statistics test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Test 2: Jordi Chat Data Access
async function testJordiDataAccess() {
  const client = await createTestClient();
  
  try {
    log('INFO', 'JORDI_ACCESS', 'Testing Jordi chat data access...');
    
    // Test article search (typical Jordi query)
    const searchQuery = `
      SELECT a.id, a.title, a.content, a.date_published, 
             array_agg(DISTINCT e.name) as entities
      FROM intelligence_articles a
      LEFT JOIN intelligence_relationships r ON a.id = r.article_id
      LEFT JOIN intelligence_entities e ON r.entity_id = e.id
      WHERE a.content ILIKE '%war%' OR a.title ILIKE '%war%'
      GROUP BY a.id, a.title, a.content, a.date_published
      LIMIT 10
    `;
    
    const searchResult = await client.query(searchQuery);
    
    if (searchResult.rows.length === 0) {
      log('FAIL', 'JORDI_ACCESS', 'No articles found in search test');
      await client.end();
      return { success: false, error: 'No search results' };
    }
    
    // Test entity relationship queries
    const entityQuery = `
      SELECT e.name, e.entity_type, COUNT(r.article_id) as article_count
      FROM intelligence_entities e
      JOIN intelligence_relationships r ON e.id = r.entity_id
      GROUP BY e.id, e.name, e.entity_type
      ORDER BY article_count DESC
      LIMIT 20
    `;
    
    const entityResult = await client.query(entityQuery);
    
    if (entityResult.rows.length === 0) {
      log('FAIL', 'JORDI_ACCESS', 'No entities found in relationship test');
      await client.end();
      return { success: false, error: 'No entity relationships' };
    }
    
    // Test temporal queries (date-based searches)
    const temporalQuery = `
      SELECT EXTRACT(YEAR FROM date_published) as year, COUNT(*) as count
      FROM intelligence_articles
      WHERE date_published IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM date_published)
      ORDER BY year
      LIMIT 10
    `;
    
    const temporalResult = await client.query(temporalQuery);
    
    log('PASS', 'JORDI_ACCESS', 'Jordi data access tests completed successfully', {
      searchResults: searchResult.rows.length,
      topEntities: entityResult.rows.slice(0, 5),
      temporalDistribution: temporalResult.rows
    });
    
    await client.end();
    return { 
      success: true, 
      searchCount: searchResult.rows.length,
      entityCount: entityResult.rows.length,
      temporalPeriods: temporalResult.rows.length
    };
    
  } catch (error) {
    await client.end();
    log('ERROR', 'JORDI_ACCESS', 'Jordi data access test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Test 3: Story Discovery Operations
async function testStoryDiscovery() {
  const client = await createTestClient();
  
  try {
    log('INFO', 'STORY_DISCOVERY', 'Testing story discovery operations...');
    
    // Test complex relationship queries for story threads
    const storyThreadQuery = `
      WITH entity_connections AS (
        SELECT r1.entity_id as entity1, r2.entity_id as entity2, 
               COUNT(DISTINCT r1.article_id) as shared_articles
        FROM intelligence_relationships r1
        JOIN intelligence_relationships r2 ON r1.article_id = r2.article_id 
        WHERE r1.entity_id != r2.entity_id
        GROUP BY r1.entity_id, r2.entity_id
        HAVING COUNT(DISTINCT r1.article_id) >= 5
      )
      SELECT e1.name as entity1_name, e2.name as entity2_name, 
             ec.shared_articles,
             e1.entity_type as entity1_type, e2.entity_type as entity2_type
      FROM entity_connections ec
      JOIN intelligence_entities e1 ON ec.entity1 = e1.id
      JOIN intelligence_entities e2 ON ec.entity2 = e2.id
      ORDER BY ec.shared_articles DESC
      LIMIT 50
    `;
    
    const connectionResult = await client.query(storyThreadQuery);
    
    // Test narrative coherence scoring
    const narrativeQuery = `
      SELECT a.id, a.title, a.date_published,
             COUNT(DISTINCT r.entity_id) as entity_count,
             COUNT(DISTINCT w.word) as unique_words
      FROM intelligence_articles a
      LEFT JOIN intelligence_relationships r ON a.id = r.article_id
      LEFT JOIN (
        SELECT article_id, unnest(string_to_array(lower(content), ' ')) as word
        FROM intelligence_articles
        WHERE content IS NOT NULL
      ) w ON a.id = w.article_id
      WHERE a.content IS NOT NULL AND length(a.content) > 500
      GROUP BY a.id, a.title, a.date_published, a.content
      HAVING COUNT(DISTINCT r.entity_id) >= 3
      ORDER BY entity_count DESC, unique_words DESC
      LIMIT 25
    `;
    
    const narrativeResult = await client.query(narrativeQuery);
    
    // Test temporal clustering for documentary potential
    const temporalClusterQuery = `
      SELECT DATE_TRUNC('month', date_published) as time_period,
             COUNT(*) as article_count,
             COUNT(DISTINCT r.entity_id) as unique_entities,
             array_agg(DISTINCT e.entity_type) as entity_types
      FROM intelligence_articles a
      JOIN intelligence_relationships r ON a.id = r.article_id
      JOIN intelligence_entities e ON r.entity_id = e.id
      WHERE a.date_published IS NOT NULL
      GROUP BY DATE_TRUNC('month', date_published)
      HAVING COUNT(*) >= 10 AND COUNT(DISTINCT r.entity_id) >= 20
      ORDER BY article_count DESC
      LIMIT 20
    `;
    
    const clusterResult = await client.query(temporalClusterQuery);
    
    if (connectionResult.rows.length === 0 || narrativeResult.rows.length === 0) {
      log('FAIL', 'STORY_DISCOVERY', 'Insufficient data for story discovery operations');
      await client.end();
      return { success: false, error: 'Insufficient story data' };
    }
    
    log('PASS', 'STORY_DISCOVERY', 'Story discovery operations completed successfully', {
      entityConnections: connectionResult.rows.length,
      narrativeCandidates: narrativeResult.rows.length,
      temporalClusters: clusterResult.rows.length,
      topConnections: connectionResult.rows.slice(0, 3),
      topNarratives: narrativeResult.rows.slice(0, 3)
    });
    
    await client.end();
    return { 
      success: true,
      connections: connectionResult.rows.length,
      narratives: narrativeResult.rows.length,
      clusters: clusterResult.rows.length
    };
    
  } catch (error) {
    await client.end();
    log('ERROR', 'STORY_DISCOVERY', 'Story discovery test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Test 4: Performance Stress Test
async function testPerformanceStress() {
  const client = await createTestClient();
  
  try {
    log('INFO', 'PERFORMANCE_STRESS', 'Testing database performance under stress...');
    
    const tests = [
      {
        name: 'Large Table Scan',
        query: 'SELECT COUNT(*) FROM intelligence_articles WHERE content IS NOT NULL',
        maxTime: 15000
      },
      {
        name: 'Complex Join Query',
        query: `
          SELECT COUNT(DISTINCT a.id)
          FROM intelligence_articles a
          JOIN intelligence_relationships r ON a.id = r.article_id
          JOIN intelligence_entities e ON r.entity_id = e.id
          WHERE a.date_published > '1940-01-01'
        `,
        maxTime: 20000
      },
      {
        name: 'Text Search Performance',
        query: `
          SELECT COUNT(*)
          FROM intelligence_articles
          WHERE content ILIKE '%government%' OR title ILIKE '%government%'
        `,
        maxTime: 25000
      }
    ];
    
    const results = {};
    let allPassed = true;
    
    for (const test of tests) {
      const startTime = Date.now();
      
      try {
        const result = await client.query(test.query);
        const duration = Date.now() - startTime;
        
        const passed = duration <= test.maxTime;
        if (!passed) allPassed = false;
        
        results[test.name] = {
          duration,
          maxTime: test.maxTime,
          passed,
          result: result.rows[0]
        };
        
        log(passed ? 'PASS' : 'FAIL', 'PERFORMANCE_STRESS', 
          `${test.name}: ${duration}ms (max: ${test.maxTime}ms)`, 
          { duration, passed, resultCount: result.rowCount }
        );
        
      } catch (error) {
        results[test.name] = {
          error: error.message,
          passed: false
        };
        allPassed = false;
        log('ERROR', 'PERFORMANCE_STRESS', `${test.name} failed`, { error: error.message });
      }
    }
    
    await client.end();
    
    if (allPassed) {
      log('PASS', 'PERFORMANCE_STRESS', 'All performance tests passed', results);
    } else {
      log('FAIL', 'PERFORMANCE_STRESS', 'Some performance tests failed', results);
    }
    
    return { success: allPassed, results };
    
  } catch (error) {
    await client.end();
    log('ERROR', 'PERFORMANCE_STRESS', 'Performance stress test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Test 5: Data Consistency Check
async function testDataConsistency() {
  const client = await createTestClient();
  
  try {
    log('INFO', 'DATA_CONSISTENCY', 'Testing data consistency and integrity...');
    
    const checks = [
      {
        name: 'Orphaned Relationships',
        query: `
          SELECT COUNT(*) as orphaned_count
          FROM intelligence_relationships r
          LEFT JOIN intelligence_articles a ON r.article_id = a.id
          LEFT JOIN intelligence_entities e ON r.entity_id = e.id
          WHERE a.id IS NULL OR e.id IS NULL
        `,
        expectedMax: 1000 // Allow some orphaned records
      },
      {
        name: 'Articles Without Content',
        query: `
          SELECT COUNT(*) as empty_count
          FROM intelligence_articles
          WHERE content IS NULL OR trim(content) = ''
        `,
        expectedMax: 50000 // Allow some articles without content
      },
      {
        name: 'Entities Without Relationships',
        query: `
          SELECT COUNT(*) as isolated_count
          FROM intelligence_entities e
          LEFT JOIN intelligence_relationships r ON e.id = r.entity_id
          WHERE r.entity_id IS NULL
        `,
        expectedMax: 100000 // Allow some isolated entities
      },
      {
        name: 'Date Range Validation',
        query: `
          SELECT COUNT(*) as invalid_dates
          FROM intelligence_articles
          WHERE date_published IS NOT NULL 
          AND (date_published < '1900-01-01' OR date_published > NOW())
        `,
        expectedMax: 100 // Very few invalid dates allowed
      }
    ];
    
    const results = {};
    let allPassed = true;
    
    for (const check of checks) {
      try {
        const result = await client.query(check.query);
        const count = parseInt(result.rows[0][Object.keys(result.rows[0])[0]]);
        const passed = count <= check.expectedMax;
        
        if (!passed) allPassed = false;
        
        results[check.name] = {
          count,
          expectedMax: check.expectedMax,
          passed
        };
        
        log(passed ? 'PASS' : 'FAIL', 'DATA_CONSISTENCY', 
          `${check.name}: ${count} (max allowed: ${check.expectedMax})`,
          { count, passed }
        );
        
      } catch (error) {
        results[check.name] = {
          error: error.message,
          passed: false
        };
        allPassed = false;
        log('ERROR', 'DATA_CONSISTENCY', `${check.name} failed`, { error: error.message });
      }
    }
    
    await client.end();
    
    if (allPassed) {
      log('PASS', 'DATA_CONSISTENCY', 'All data consistency checks passed', results);
    } else {
      log('FAIL', 'DATA_CONSISTENCY', 'Some data consistency checks failed', results);
    }
    
    return { success: allPassed, results };
    
  } catch (error) {
    await client.end();
    log('ERROR', 'DATA_CONSISTENCY', 'Data consistency test failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  log('INFO', 'MASTER', '🚀 Starting comprehensive database operations test suite...');
  
  const tests = [
    { name: 'Database Stats', fn: testDatabaseStats },
    { name: 'Jordi Data Access', fn: testJordiDataAccess },
    { name: 'Story Discovery', fn: testStoryDiscovery },
    { name: 'Performance Stress', fn: testPerformanceStress },
    { name: 'Data Consistency', fn: testDataConsistency }
  ];
  
  const results = {};
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      log('INFO', 'MASTER', `Running ${test.name} test...`);
      const result = await test.fn();
      results[test.name] = result;
      
      if (result.success) {
        passedTests++;
        log('PASS', 'MASTER', `✅ ${test.name} test completed successfully`);
      } else {
        log('FAIL', 'MASTER', `❌ ${test.name} test failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      results[test.name] = { success: false, error: error.message };
      log('ERROR', 'MASTER', `💥 ${test.name} test crashed: ${error.message}`);
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successRate = (passedTests / tests.length * 100).toFixed(1);
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    duration: totalTime,
    totalTests: tests.length,
    passedTests,
    successRate: `${successRate}%`,
    results,
    summary: {
      databaseConnectivity: results['Database Stats']?.success || false,
      jordiOperational: results['Jordi Data Access']?.success || false,
      storyDiscoveryReady: results['Story Discovery']?.success || false,
      performanceAcceptable: results['Performance Stress']?.success || false,
      dataIntegrityHealthy: results['Data Consistency']?.success || false
    }
  };
  
  const reportPath = path.join(__dirname, '../logs/database_operations_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log('INFO', 'MASTER', `🏁 Test suite completed in ${totalTime}ms`);
  log('INFO', 'MASTER', `📊 Results: ${passedTests}/${tests.length} tests passed (${successRate}%)`);
  log('INFO', 'MASTER', `📄 Full report saved to: ${reportPath}`);
  
  if (passedTests === tests.length) {
    log('PASS', 'MASTER', '🎉 ALL TESTS PASSED - StoryMine database operations are fully functional!');
    process.exit(0);
  } else {
    log('FAIL', 'MASTER', '⚠️  SOME TESTS FAILED - Check logs for details');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    log('ERROR', 'MASTER', 'Test suite crashed', { error: error.message });
    process.exit(1);
  });
}

module.exports = {
  testDatabaseStats,
  testJordiDataAccess,
  testStoryDiscovery,
  testPerformanceStress,
  testDataConsistency,
  runAllTests
}; 
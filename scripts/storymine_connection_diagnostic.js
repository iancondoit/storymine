#!/usr/bin/env node

/**
 * StoryMine Database Connection Diagnostic Tool
 * 
 * This script tests database connectivity and provides specific solutions
 * for connection issues between Railway and AWS RDS.
 */

const { Pool } = require('pg');

// Connection configurations to test
const connectionConfigs = [
  {
    name: "Standard SSL Connection",
    config: {
      connectionString: "postgresql://storymineadmin:OaUTdD3iEIrzMui@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine",
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: "SSL Required Mode",
    config: {
      host: "storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com",
      port: 5432,
      database: "storymine",
      user: "storymineadmin",
      password: "OaUTdD3iEIrzMui",
      ssl: { rejectUnauthorized: false, sslmode: 'require' }
    }
  },
  {
    name: "No SSL (Testing Only)",
    config: {
      host: "storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com",
      port: 5432,
      database: "storymine",
      user: "storymineadmin",
      password: "OaUTdD3iEIrzMui",
      ssl: false
    }
  },
  {
    name: "Connection String with SSL Parameters",
    config: {
      connectionString: "postgresql://storymineadmin:OaUTdD3iEIrzMui@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine?sslmode=require"
    }
  }
];

/**
 * Test a single database connection configuration
 */
async function testConnection(name, config) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
  
  const pool = new Pool(config);
  
  try {
    // Test basic connection
    const client = await pool.connect();
    console.log(`✅ Connection successful!`);
    
    // Test query execution
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`✅ Query execution successful`);
    console.log(`   Server time: ${result.rows[0].current_time}`);
    
    // Test Intelligence data access
    try {
      const articlesResult = await client.query('SELECT COUNT(*) as count FROM intelligence_articles');
      const entitiesResult = await client.query('SELECT COUNT(*) as count FROM intelligence_entities');
      const relationshipsResult = await client.query('SELECT COUNT(*) as count FROM intelligence_relationships');
      const storiesResult = await client.query('SELECT COUNT(*) as count FROM intelligence_stories');
      
      console.log(`✅ Intelligence Data Access:`);
      console.log(`   Articles: ${articlesResult.rows[0].count.toLocaleString()}`);
      console.log(`   Entities: ${entitiesResult.rows[0].count.toLocaleString()}`);
      console.log(`   Relationships: ${relationshipsResult.rows[0].count.toLocaleString()}`);
      console.log(`   Stories: ${storiesResult.rows[0].count.toLocaleString()}`);
      
      // Test sample data retrieval
      const sampleResult = await client.query(`
        SELECT id, title, publication_date, narrative_score, documentary_potential 
        FROM intelligence_articles 
        LIMIT 3
      `);
      
      console.log(`✅ Sample Data Preview:`);
      sampleResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. "${row.title}" (${row.publication_date})`);
      });
      
    } catch (dataError) {
      console.log(`⚠️  Data access failed: ${dataError.message}`);
      console.log(`   (Connection works, but Intelligence tables may not exist)`);
    }
    
    client.release();
    await pool.end();
    
    return { success: true, config: name };
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    console.log(`   Error code: ${error.code}`);
    
    // Provide specific solutions based on error type
    if (error.code === 'ENOTFOUND') {
      console.log(`💡 Solution: DNS resolution failed. Check hostname.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`💡 Solution: Connection refused. Check:`);
      console.log(`   - Database server is running`);
      console.log(`   - Port 5432 is accessible`);
      console.log(`   - Security group allows your IP range`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`💡 Solution: Connection timeout. Check:`);
      console.log(`   - Network connectivity`);
      console.log(`   - AWS Security Group rules`);
      console.log(`   - VPC configuration`);
    } else if (error.message.includes('authentication')) {
      console.log(`💡 Solution: Authentication failed. Check:`);
      console.log(`   - Username: storymineadmin`);
      console.log(`   - Password correctness`);
      console.log(`   - User permissions`);
    } else if (error.message.includes('SSL')) {
      console.log(`💡 Solution: SSL configuration issue. Try:`);
      console.log(`   - Different SSL modes`);
      console.log(`   - SSL certificate validation settings`);
    }
    
    await pool.end();
    return { success: false, error: error.message, config: name };
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log(`🚀 StoryMine Database Connection Diagnostic Tool`);
  console.log(`==============================================`);
  console.log(`Testing connections to AWS RDS PostgreSQL...`);
  
  const results = [];
  
  for (const { name, config } of connectionConfigs) {
    const result = await testConnection(name, config);
    results.push(result);
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log(`\n📊 DIAGNOSTIC SUMMARY`);
  console.log(`====================`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`✅ Successful Connections (${successful.length}):`);
    successful.forEach(r => console.log(`   - ${r.config}`));
    
    console.log(`\n🎯 RECOMMENDATION:`);
    console.log(`Use "${successful[0].config}" configuration for Railway deployment.`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Connections (${failed.length}):`);
    failed.forEach(r => console.log(`   - ${r.config}: ${r.error}`));
  }
  
  if (successful.length === 0) {
    console.log(`\n🚨 ALL CONNECTIONS FAILED`);
    console.log(`Most likely causes:`);
    console.log(`1. AWS Security Group not allowing Railway IP ranges`);
    console.log(`2. Database server not running`);
    console.log(`3. Network connectivity issues`);
    console.log(`\nImmediate fix: Update AWS Security Group to allow 0.0.0.0/0 temporarily`);
  }
  
  // Railway specific instructions
  console.log(`\n🚄 RAILWAY DEPLOYMENT INSTRUCTIONS`);
  console.log(`===================================`);
  
  if (successful.length > 0) {
    console.log(`Set this environment variable in Railway:`);
    if (successful[0].config.includes("Standard SSL")) {
      console.log(`DATABASE_URL=postgresql://storymineadmin:OaUTdD3iEIrzMui@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine`);
    } else if (successful[0].config.includes("SSL Required")) {
      console.log(`DATABASE_URL=postgresql://storymineadmin:OaUTdD3iEIrzMui@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine?sslmode=require`);
    }
    
    console.log(`\nThen redeploy StoryMine with:`);
    console.log(`railway up`);
  } else {
    console.log(`Fix security group first, then run this diagnostic again.`);
  }
}

// Run diagnostics
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { testConnection, runDiagnostics }; 
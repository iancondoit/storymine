const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : 
    false
};

const pool = new Pool(dbConfig);

async function queryAWSStories() {
  console.log('🔍 Querying 50 randomized stories from AWS database...\n');
  
  try {
    // Query exactly what our service should be getting
    const queryText = `
      SELECT 
        storymap_id as id,
        title,
        LEFT(content, 2000) as content_preview,
        LENGTH(content) as content_length,
        publication_date,
        EXTRACT(YEAR FROM publication_date) as year,
        documentary_potential,
        narrative_score,
        primary_themes,
        secondary_themes,
        primary_location,
        secondary_locations
      FROM intelligence_articles
      WHERE documentary_potential IS NOT NULL 
        AND narrative_score IS NOT NULL
        AND documentary_potential >= 0.5
        AND narrative_score >= 0.4
      ORDER BY RANDOM()
      LIMIT 50;
    `;
    
    console.log('📊 Executing query...');
    const result = await pool.query(queryText);
    
    console.log(`✅ Retrieved ${result.rows.length} stories`);
    
    // Show sample of what we got
    console.log('\n📋 Sample of raw data:');
    console.log('='.repeat(80));
    
    const sample = result.rows[0];
    if (sample) {
      console.log('Sample Story #1:');
      console.log(`ID: ${sample.id}`);
      console.log(`Title: "${sample.title}"`);
      console.log(`Year: ${sample.year}`);
      console.log(`Documentary Potential: ${sample.documentary_potential}`);
      console.log(`Narrative Score: ${sample.narrative_score}`);
      console.log(`Primary Themes: ${JSON.stringify(sample.primary_themes)}`);
      console.log(`Primary Location: ${sample.primary_location}`);
      console.log(`Content Length: ${sample.content_length}`);
      console.log(`Content Preview: "${sample.content_preview?.substring(0, 200)}..."`);
      console.log('');
    }
    
    // Show statistics
    console.log('📈 Data Statistics:');
    console.log('='.repeat(80));
    
    const stats = {
      totalStories: result.rows.length,
      averageDocumentaryPotential: (result.rows.reduce((sum, row) => sum + row.documentary_potential, 0) / result.rows.length).toFixed(3),
      averageNarrativeScore: (result.rows.reduce((sum, row) => sum + row.narrative_score, 0) / result.rows.length).toFixed(3),
      yearRange: {
        earliest: Math.min(...result.rows.map(r => r.year)),
        latest: Math.max(...result.rows.map(r => r.year))
      },
      contentLengths: {
        min: Math.min(...result.rows.map(r => r.content_length || 0)),
        max: Math.max(...result.rows.map(r => r.content_length || 0)),
        average: Math.round(result.rows.reduce((sum, row) => sum + (row.content_length || 0), 0) / result.rows.length)
      },
      themesDistribution: {},
      locationsDistribution: {}
    };
    
    // Count themes
    result.rows.forEach(row => {
      if (row.primary_themes && Array.isArray(row.primary_themes)) {
        row.primary_themes.forEach(theme => {
          stats.themesDistribution[theme] = (stats.themesDistribution[theme] || 0) + 1;
        });
      }
    });
    
    // Count locations
    result.rows.forEach(row => {
      if (row.primary_location) {
        stats.locationsDistribution[row.primary_location] = (stats.locationsDistribution[row.primary_location] || 0) + 1;
      }
    });
    
    console.log(JSON.stringify(stats, null, 2));
    
    // Save full data to file
    const outputData = {
      metadata: {
        queryTime: new Date().toISOString(),
        totalStories: result.rows.length,
        source: 'AWS RDS intelligence_articles table',
        query: 'Random sample with documentary_potential >= 0.5 and narrative_score >= 0.4'
      },
      statistics: stats,
      stories: result.rows
    };
    
    fs.writeFileSync('aws_stories_sample.json', JSON.stringify(outputData, null, 2));
    console.log('\n💾 Full data saved to aws_stories_sample.json');
    
    // Show a few more title examples
    console.log('\n📰 Sample Titles:');
    console.log('='.repeat(80));
    result.rows.slice(0, 10).forEach((story, i) => {
      console.log(`${i + 1}. "${story.title}" (${story.year}) - Doc: ${(story.documentary_potential * 100).toFixed(1)}%, Nar: ${(story.narrative_score * 100).toFixed(1)}%`);
    });
    
    // Check for data quality issues
    console.log('\n🔍 Data Quality Check:');
    console.log('='.repeat(80));
    
    const qualityIssues = {
      nullTitles: result.rows.filter(r => !r.title).length,
      shortTitles: result.rows.filter(r => r.title && r.title.length < 10).length,
      fragmentTitles: result.rows.filter(r => r.title && (r.title.includes('"') || r.title.endsWith(' '))).length,
      nullContent: result.rows.filter(r => !r.content_preview).length,
      shortContent: result.rows.filter(r => r.content_length < 500).length,
      nullThemes: result.rows.filter(r => !r.primary_themes || r.primary_themes.length === 0).length,
      nullLocations: result.rows.filter(r => !r.primary_location).length,
      perfectScores: result.rows.filter(r => r.documentary_potential === 1.0 && r.narrative_score === 1.0).length
    };
    
    console.log('Quality Issues Found:');
    Object.entries(qualityIssues).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`  ⚠️  ${issue}: ${count} stories`);
      } else {
        console.log(`  ✅ ${issue}: ${count} stories`);
      }
    });
    
    console.log('\n✅ Query complete! Check aws_stories_sample.json for full data.');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Connection details:', {
      hasConnectionString: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });
  } finally {
    await pool.end();
  }
}

// Run the query
queryAWSStories(); 
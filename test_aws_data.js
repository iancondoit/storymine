const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? 
    { rejectUnauthorized: false } : 
    false
};

const pool = new Pool(dbConfig);

async function testAWSIntelligenceData() {
  console.log('🔍 Testing AWS Intelligence Data Format...\n');
  
  try {
    // Test 1: Basic data completeness
    console.log('📊 Test 1: Data Completeness');
    const completenessQuery = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(documentary_potential) as scored_articles,
        COUNT(narrative_score) as narrative_scored,
        COUNT(primary_themes) as themed_articles,
        COUNT(primary_location) as located_articles
      FROM intelligence_articles;
    `;
    
    const completeness = await pool.query(completenessQuery);
    console.log('Results:', completeness.rows[0]);
    console.log('✅ NULL Check:', completeness.rows[0].total_articles === completeness.rows[0].scored_articles ? 'PASS' : 'FAIL');
    console.log('');

    // Test 2: Quality distribution
    console.log('📈 Test 2: Quality Distribution');
    const qualityQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE documentary_potential >= 0.9) as exceptional_quality,
        COUNT(*) FILTER (WHERE documentary_potential >= 0.8) as high_quality,
        COUNT(*) FILTER (WHERE documentary_potential >= 0.7) as good_quality,
        COUNT(*) FILTER (WHERE documentary_potential >= 0.6) as medium_quality,
        COUNT(*) FILTER (WHERE documentary_potential >= 0.5) as basic_quality,
        ROUND(AVG(documentary_potential)::numeric, 3) as avg_documentary,
        ROUND(AVG(narrative_score)::numeric, 3) as avg_narrative
      FROM intelligence_articles;
    `;
    
    const quality = await pool.query(qualityQuery);
    console.log('Quality Distribution:', quality.rows[0]);
    console.log('');

    // Test 3: Date range verification
    console.log('📅 Test 3: Date Range Coverage');
    const dateQuery = `
      SELECT 
        MIN(publication_date) as earliest_date,
        MAX(publication_date) as latest_date,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1890 AND 1900) as "1890s",
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1900 AND 1910) as "1900s",
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1910 AND 1920) as "1910s",
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1920 AND 1930) as "1920s",
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1930 AND 1940) as "1930s",
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM publication_date) BETWEEN 1940 AND 1950) as "1940s"
      FROM intelligence_articles;
    `;
    
    const dates = await pool.query(dateQuery);
    console.log('Date Coverage:', dates.rows[0]);
    console.log('');

    // Test 4: Sample high-quality stories
    console.log('🎬 Test 4: Sample High-Quality Stories');
    const sampleQuery = `
      SELECT 
        storymap_id,
        title,
        EXTRACT(YEAR FROM publication_date) as year,
        ROUND(documentary_potential::numeric, 3) as doc_potential,
        ROUND(narrative_score::numeric, 3) as narrative,
        primary_themes,
        primary_location
      FROM intelligence_articles 
      WHERE documentary_potential >= 0.8 
        AND narrative_score >= 0.7
        AND title IS NOT NULL
        AND LENGTH(title) > 20
      ORDER BY documentary_potential DESC, narrative_score DESC
      LIMIT 5;
    `;
    
    const samples = await pool.query(sampleQuery);
    console.log('High-Quality Sample Stories:');
    samples.rows.forEach((story, i) => {
      console.log(`${i + 1}. "${story.title}" (${story.year})`);
      console.log(`   Documentary: ${story.doc_potential}, Narrative: ${story.narrative}`);
      console.log(`   Themes: ${story.primary_themes ? story.primary_themes.join(', ') : 'None'}`);
      console.log(`   Location: ${story.primary_location || 'Not specified'}`);
      console.log('');
    });

    // Test 5: Category distribution
    console.log('📂 Test 5: Thematic Distribution');
    const themeQuery = `
      SELECT 
        unnest(primary_themes) as theme,
        COUNT(*) as article_count,
        ROUND(AVG(documentary_potential)::numeric, 3) as avg_quality
      FROM intelligence_articles 
      WHERE primary_themes IS NOT NULL
      GROUP BY unnest(primary_themes)
      ORDER BY article_count DESC
      LIMIT 10;
    `;
    
    const themes = await pool.query(themeQuery);
    console.log('Top Themes by Article Count:');
    themes.rows.forEach((theme, i) => {
      console.log(`${i + 1}. ${theme.theme}: ${theme.article_count} articles (avg quality: ${theme.avg_quality})`);
    });
    console.log('');

    // Test 6: Test our new service query
    console.log('🔧 Test 6: Service Query Simulation');
    const serviceQuery = `
      SELECT 
        storymap_id as id,
        title,
        LEFT(content, 200) as content_preview,
        LENGTH(content) as content_length,
        publication_date,
        EXTRACT(YEAR FROM publication_date) as year,
        documentary_potential,
        narrative_score,
        primary_themes,
        secondary_themes,
        primary_location
      FROM intelligence_articles
      WHERE documentary_potential IS NOT NULL 
        AND narrative_score IS NOT NULL
        AND documentary_potential >= 0.5
        AND narrative_score >= 0.4
        AND (title ILIKE '%politics%' OR content ILIKE '%politics%' OR primary_themes::text ILIKE '%politics%')
      ORDER BY 
        (documentary_potential * 0.6 + narrative_score * 0.4) DESC,
        documentary_potential DESC,
        narrative_score DESC,
        RANDOM()
      LIMIT 3;
    `;
    
    const serviceTest = await pool.query(serviceQuery);
    console.log('Service Query Test (Politics Category):');
    serviceTest.rows.forEach((story, i) => {
      console.log(`${i + 1}. "${story.title}" (${story.year})`);
      console.log(`   Quality Score: ${Math.round(story.documentary_potential * 100)}% doc, ${Math.round(story.narrative_score * 100)}% narrative`);
      console.log(`   Content Length: ${story.content_length} chars`);
      console.log(`   Preview: ${story.content_preview}...`);
      console.log('');
    });

    console.log('✅ AWS Intelligence Data Test Complete!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Connection details:', {
      hasConnectionString: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });
  } finally {
    await pool.end();
  }
}

// Run the test
testAWSIntelligenceData(); 
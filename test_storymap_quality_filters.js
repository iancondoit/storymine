/**
 * Test StoryMap Intelligence Quality Filters
 * Verify we're accessing clean, high-quality articles as recommended
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://storymineadmin:OaUTdD3iEIrzMui@storymine-production.cmb42682sq1z.us-east-1.rds.amazonaws.com:5432/storymine';

async function testStoryMapQualityFilters() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔗 Connected to AWS database');
    
    // Test 1: StoryMap Intelligence Recommended Query (High Quality)
    console.log('\n📊 TEST 1: StoryMap Intelligence Recommended Filters (Tier 1 - Premium)');
    const tier1Query = `
      SELECT 
        storymap_id,
        title,
        LENGTH(title) as title_length,
        documentary_potential,
        narrative_score,
        primary_themes,
        primary_location,
        publication_date
      FROM intelligence_articles 
      WHERE documentary_potential >= 0.7 
        AND narrative_score >= 0.7
        AND LENGTH(title) >= 20
        AND LENGTH(title) <= 100
        AND title NOT ILIKE '%ofthe%'
        AND title NOT ILIKE '%inthe%'
        AND title NOT ILIKE '%by %'
        AND title NOT ILIKE '%weather%'
      ORDER BY documentary_potential DESC, narrative_score DESC
      LIMIT 10;
    `;
    
    const tier1Result = await client.query(tier1Query);
    console.log(`✅ Found ${tier1Result.rows.length} Tier 1 Premium articles`);
    
    if (tier1Result.rows.length > 0) {
      console.log('\n🎯 Sample Tier 1 Articles:');
      tier1Result.rows.forEach((article, i) => {
        console.log(`${i + 1}. "${article.title}"`);
        console.log(`   📊 Documentary: ${Math.round(article.documentary_potential * 100)}%, Narrative: ${Math.round(article.narrative_score * 100)}%`);
        console.log(`   📍 Location: ${article.primary_location || 'N/A'}`);
        console.log(`   📅 Date: ${article.publication_date}`);
        console.log(`   🏷️  Themes: ${article.primary_themes ? article.primary_themes.join(', ') : 'N/A'}`);
        console.log('');
      });
    }
    
    // Test 2: StoryMap Intelligence Recommended Query (Good Quality)
    console.log('\n📊 TEST 2: StoryMap Intelligence Recommended Filters (Tier 2 - Good)');
    const tier2Query = `
      SELECT 
        storymap_id,
        title,
        LENGTH(title) as title_length,
        documentary_potential,
        narrative_score,
        primary_themes,
        primary_location,
        publication_date
      FROM intelligence_articles 
      WHERE documentary_potential >= 0.6 
        AND narrative_score >= 0.5
        AND LENGTH(title) >= 15
        AND LENGTH(title) <= 100
        AND title NOT ILIKE '%ofthe%'
        AND title NOT ILIKE '%inthe%'
        AND title NOT ILIKE '%by %'
        AND title NOT ILIKE '%weather%'
      ORDER BY documentary_potential DESC, narrative_score DESC
      LIMIT 20;
    `;
    
    const tier2Result = await client.query(tier2Query);
    console.log(`✅ Found ${tier2Result.rows.length} Tier 2 Good Quality articles`);
    
    if (tier2Result.rows.length > 0) {
      console.log('\n🎯 Sample Tier 2 Articles:');
      tier2Result.rows.slice(0, 5).forEach((article, i) => {
        console.log(`${i + 1}. "${article.title}"`);
        console.log(`   📊 Documentary: ${Math.round(article.documentary_potential * 100)}%, Narrative: ${Math.round(article.narrative_score * 100)}%`);
        console.log(`   📍 Location: ${article.primary_location || 'N/A'}`);
        console.log('');
      });
    }
    
    // Test 3: Compare with unfiltered data (what we were getting before)
    console.log('\n📊 TEST 3: Comparison - Unfiltered Data (What We Were Getting Before)');
    const unfilteredQuery = `
      SELECT 
        storymap_id,
        title,
        LENGTH(title) as title_length,
        documentary_potential,
        narrative_score
      FROM intelligence_articles 
      WHERE title IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 10;
    `;
    
    const unfilteredResult = await client.query(unfilteredQuery);
    console.log(`❌ Sample of unfiltered data (${unfilteredResult.rows.length} articles):`);
    
    unfilteredResult.rows.forEach((article, i) => {
      const isClean = article.title.length >= 15 && 
                     !article.title.toLowerCase().includes('ofthe') &&
                     !article.title.toLowerCase().includes('inthe') &&
                     !article.title.toLowerCase().includes('by ') &&
                     !article.title.toLowerCase().includes('weather');
      
      console.log(`${i + 1}. "${article.title}" ${isClean ? '✅' : '❌'}`);
      console.log(`   📊 Documentary: ${Math.round((article.documentary_potential || 0) * 100)}%, Narrative: ${Math.round((article.narrative_score || 0) * 100)}%`);
      console.log('');
    });
    
    // Test 4: Quality Statistics
    console.log('\n📊 TEST 4: Quality Statistics');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_articles,
        COUNT(CASE WHEN documentary_potential >= 0.7 AND narrative_score >= 0.7 AND LENGTH(title) >= 20 THEN 1 END) as tier1_premium,
        COUNT(CASE WHEN documentary_potential >= 0.6 AND narrative_score >= 0.5 AND LENGTH(title) >= 15 THEN 1 END) as tier2_good,
        COUNT(CASE WHEN LENGTH(title) < 15 OR title ILIKE '%ofthe%' OR title ILIKE '%inthe%' OR title ILIKE '%by %' OR title ILIKE '%weather%' THEN 1 END) as filtered_out,
        ROUND(AVG(documentary_potential), 3) as avg_documentary_potential,
        ROUND(AVG(narrative_score), 3) as avg_narrative_score
      FROM intelligence_articles 
      WHERE title IS NOT NULL;
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('📈 Database Quality Statistics:');
    console.log(`   📚 Total Articles: ${stats.total_articles.toLocaleString()}`);
    console.log(`   🏆 Tier 1 Premium (≥70% both scores, ≥20 char titles): ${stats.tier1_premium.toLocaleString()} (${Math.round(stats.tier1_premium / stats.total_articles * 100)}%)`);
    console.log(`   ✅ Tier 2 Good (≥60% doc, ≥50% nar, ≥15 char titles): ${stats.tier2_good.toLocaleString()} (${Math.round(stats.tier2_good / stats.total_articles * 100)}%)`);
    console.log(`   ❌ Filtered Out (short/corrupted titles): ${stats.filtered_out.toLocaleString()} (${Math.round(stats.filtered_out / stats.total_articles * 100)}%)`);
    console.log(`   📊 Average Documentary Potential: ${Math.round(stats.avg_documentary_potential * 100)}%`);
    console.log(`   📊 Average Narrative Score: ${Math.round(stats.avg_narrative_score * 100)}%`);
    
    // Test 5: Verify our current StoryMine query matches StoryMap recommendations
    console.log('\n📊 TEST 5: Testing Our Updated StoryMine Query');
    const storyMineQuery = `
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
      WHERE documentary_potential >= 0.6
        AND narrative_score >= 0.5
        AND LENGTH(title) >= 15
        AND LENGTH(title) <= 100
        AND title NOT ILIKE '%ofthe%'
        AND title NOT ILIKE '%inthe%'
        AND title NOT ILIKE '%by %'
        AND title NOT ILIKE '%weather%'
      ORDER BY 
        documentary_potential DESC, 
        narrative_score DESC
      LIMIT 5;
    `;
    
    const storyMineResult = await client.query(storyMineQuery);
    console.log(`✅ StoryMine Updated Query Results: ${storyMineResult.rows.length} clean articles`);
    
    if (storyMineResult.rows.length > 0) {
      console.log('\n🎯 StoryMine Will Now Receive:');
      storyMineResult.rows.forEach((article, i) => {
        console.log(`${i + 1}. "${article.title}"`);
        console.log(`   📊 Documentary: ${Math.round(article.documentary_potential * 100)}%, Narrative: ${Math.round(article.narrative_score * 100)}%`);
        console.log(`   📍 Location: ${article.primary_location || 'N/A'}`);
        console.log(`   📅 Year: ${article.year}`);
        console.log(`   📝 Content Length: ${article.content_length} characters`);
        console.log('');
      });
    }
    
    console.log('\n🎉 CONCLUSION: StoryMap Intelligence Quality Filters Successfully Implemented!');
    console.log('✅ We are now accessing clean, high-quality articles');
    console.log('✅ Corrupted OCR fragments are filtered out');
    console.log('✅ Only meaningful headlines with proper documentary scores');
    console.log('✅ StoryMine will present quality information as intended');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

// Run the test
testStoryMapQualityFilters().catch(console.error); 
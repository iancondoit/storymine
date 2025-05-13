/**
 * Database setup script
 * This script creates the necessary tables if they don't exist
 */

import { query } from './connection';

/**
 * Create database tables if they don't exist
 */
export async function createTables(): Promise<void> {
  try {
    console.log('Setting up database tables...');

    // Create articles table
    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(100) UNIQUE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        content_embedding VECTOR(384),
        publish_date DATE,
        publication VARCHAR(100),
        section VARCHAR(50),
        word_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Articles table created or already exists');

    // Create indexes on articles table
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_publish_date ON articles(publish_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_publication ON articles(publication)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_articles_section ON articles(section)`);
    console.log('Articles indexes created or already exist');

    // Create entities table
    await query(`
      CREATE TABLE IF NOT EXISTS entities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Entities table created or already exists');

    // Create unique index on entities
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_name_type ON entities(name, type)`);
    console.log('Entities index created or already exists');

    // Create article_entities junction table
    await query(`
      CREATE TABLE IF NOT EXISTS article_entities (
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        entity_id INTEGER REFERENCES entities(id) ON DELETE CASCADE,
        relevance_score FLOAT,
        mention_count INTEGER,
        PRIMARY KEY (article_id, entity_id)
      )
    `);
    console.log('Article_entities table created or already exists');

    // Create indexes on article_entities
    await query(`CREATE INDEX IF NOT EXISTS idx_article_entities_entity_id ON article_entities(entity_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_article_entities_relevance ON article_entities(relevance_score)`);
    console.log('Article_entities indexes created or already exist');

    // Create tags table
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    console.log('Tags table created or already exists');

    // Create article_tags junction table
    await query(`
      CREATE TABLE IF NOT EXISTS article_tags (
        article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
        tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
        confidence FLOAT,
        PRIMARY KEY (article_id, tag_id)
      )
    `);
    console.log('Article_tags table created or already exists');

    // Create index on article_tags
    await query(`CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON article_tags(tag_id)`);
    console.log('Article_tags index created or already exists');

    // Create article_full_view
    await query(`
      CREATE OR REPLACE VIEW article_full_view AS
      SELECT 
        a.id, a.title, a.content, a.publish_date, a.publication, a.section,
        (
          SELECT json_agg(json_build_object(
            'name', e.name,
            'type', e.type,
            'relevance', ae.relevance_score,
            'mentions', ae.mention_count
          ))
          FROM article_entities ae
          JOIN entities e ON ae.entity_id = e.id
          WHERE ae.article_id = a.id
        ) as entities,
        (
          SELECT json_agg(json_build_object(
            'name', t.name,
            'confidence', at.confidence
          ))
          FROM article_tags at
          JOIN tags t ON at.tag_id = t.id
          WHERE at.article_id = a.id
        ) as tags
      FROM articles a
    `);
    console.log('Article_full_view created or replaced');

    console.log('Database setup complete');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

/**
 * Seed the database with sample data if it's empty
 */
export async function seedSampleData(): Promise<void> {
  try {
    // Check if we have any articles
    const articleCount = await query('SELECT COUNT(*) as count FROM articles');
    
    if (parseInt(articleCount.rows[0].count) > 0) {
      console.log('Database already contains articles, skipping sample data seed');
      return;
    }
    
    console.log('Seeding sample data...');
    
    // Sample articles
    const articles = [
      {
        external_id: 'sample_article_1',
        title: 'The Civil Rights Movement in Atlanta',
        content: 'The civil rights movement in Atlanta was a significant part of the American civil rights movement...',
        publish_date: '1965-03-15',
        publication: 'Atlanta Constitution',
        section: 'news',
        word_count: 1500
      },
      {
        external_id: 'sample_article_2',
        title: 'Moon Landing Success',
        content: 'Yesterday, American astronauts landed on the moon, marking one of humanity\'s greatest achievements...',
        publish_date: '1969-07-21',
        publication: 'New York Times',
        section: 'front_page',
        word_count: 1200
      },
      {
        external_id: 'sample_article_3',
        title: 'The Great Molasses Flood',
        content: 'A wave of molasses rushed through the streets of Boston\'s North End, killing 21 and injuring 150...',
        publish_date: '1919-01-16',
        publication: 'Boston Globe',
        section: 'local',
        word_count: 850
      }
    ];
    
    // Insert articles
    for (const article of articles) {
      await query(`
        INSERT INTO articles (external_id, title, content, publish_date, publication, section, word_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        article.external_id,
        article.title,
        article.content,
        article.publish_date,
        article.publication,
        article.section,
        article.word_count
      ]);
    }
    
    console.log('Inserted sample articles');
    
    // Sample entities
    const entities = [
      { name: 'Martin Luther King Jr.', type: 'person' },
      { name: 'Atlanta', type: 'location' },
      { name: 'NASA', type: 'organization' },
      { name: 'Neil Armstrong', type: 'person' },
      { name: 'Boston', type: 'location' }
    ];
    
    // Insert entities
    const entityIds: Record<string, number> = {};
    for (const entity of entities) {
      const result = await query(`
        INSERT INTO entities (name, type)
        VALUES ($1, $2)
        RETURNING id
      `, [entity.name, entity.type]);
      
      entityIds[entity.name] = result.rows[0].id;
    }
    
    console.log('Inserted sample entities');
    
    // Get article IDs
    const articleResults = await query('SELECT id, title FROM articles');
    const articleIds: Record<string, number> = {};
    for (const row of articleResults.rows) {
      articleIds[row.title] = row.id;
    }
    
    // Article-entity relationships
    const articleEntities = [
      { article: 'The Civil Rights Movement in Atlanta', entity: 'Martin Luther King Jr.', relevance: 0.9, mentions: 12 },
      { article: 'The Civil Rights Movement in Atlanta', entity: 'Atlanta', relevance: 0.8, mentions: 15 },
      { article: 'Moon Landing Success', entity: 'NASA', relevance: 0.95, mentions: 8 },
      { article: 'Moon Landing Success', entity: 'Neil Armstrong', relevance: 0.9, mentions: 6 },
      { article: 'The Great Molasses Flood', entity: 'Boston', relevance: 0.85, mentions: 9 }
    ];
    
    // Insert article-entity relationships
    for (const relation of articleEntities) {
      await query(`
        INSERT INTO article_entities (article_id, entity_id, relevance_score, mention_count)
        VALUES ($1, $2, $3, $4)
      `, [
        articleIds[relation.article],
        entityIds[relation.entity],
        relation.relevance,
        relation.mentions
      ]);
    }
    
    console.log('Inserted sample article-entity relationships');
    
    // Sample tags
    const tags = [
      'civil rights',
      'history',
      'politics',
      'space exploration',
      'science',
      'disaster',
      'local news'
    ];
    
    // Insert tags
    const tagIds: Record<string, number> = {};
    for (const tag of tags) {
      const result = await query(`
        INSERT INTO tags (name)
        VALUES ($1)
        RETURNING id
      `, [tag]);
      
      tagIds[tag] = result.rows[0].id;
    }
    
    console.log('Inserted sample tags');
    
    // Article-tag relationships
    const articleTags = [
      { article: 'The Civil Rights Movement in Atlanta', tag: 'civil rights', confidence: 0.95 },
      { article: 'The Civil Rights Movement in Atlanta', tag: 'history', confidence: 0.9 },
      { article: 'The Civil Rights Movement in Atlanta', tag: 'politics', confidence: 0.85 },
      { article: 'Moon Landing Success', tag: 'space exploration', confidence: 0.98 },
      { article: 'Moon Landing Success', tag: 'science', confidence: 0.9 },
      { article: 'Moon Landing Success', tag: 'history', confidence: 0.8 },
      { article: 'The Great Molasses Flood', tag: 'disaster', confidence: 0.95 },
      { article: 'The Great Molasses Flood', tag: 'local news', confidence: 0.9 },
      { article: 'The Great Molasses Flood', tag: 'history', confidence: 0.85 }
    ];
    
    // Insert article-tag relationships
    for (const relation of articleTags) {
      await query(`
        INSERT INTO article_tags (article_id, tag_id, confidence)
        VALUES ($1, $2, $3)
      `, [
        articleIds[relation.article],
        tagIds[relation.tag],
        relation.confidence
      ]);
    }
    
    console.log('Inserted sample article-tag relationships');
    
    console.log('Sample data seeded successfully');
  } catch (error) {
    console.error('Error seeding sample data:', error);
    throw error;
  }
} 
import Anthropic from '@anthropic-ai/sdk';
import { intelligenceQueryService } from './intelligenceQueryService.js';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export class JordiService {
  constructor() {
    this.intelligenceQuery = intelligenceQueryService;
  }

  async askJordi(question, context = {}) {
    const systemPrompt = `You are Jordi, a narrative archaeologist specializing in discovering lost stories from historical newspaper archives. You have access to StoryMap Intelligence data containing 282,387 enhanced articles, 1.4M entities, and 1.2M relationships from 1890-1950.

Your mission: Help users discover compelling stories with documentary potential.

Current Intelligence Data Context:
- Articles with narrative scoring and documentary potential (0-1.0 scale)
- Entities with biographical context and significance metrics
- Relationships with evidence and dramatic tension analysis
- Story threads optimized for visual storytelling
- Focus period: 1890-1950, primarily Atlanta and surrounding regions

Key capabilities:
- Find documentary-worthy stories based on narrative potential
- Analyze entity relationships and their dramatic tension
- Construct temporal narratives for timeline creation
- Assess production complexity and archival richness
- Identify visual storytelling opportunities

Respond as a knowledgeable but approachable historical researcher who finds the human stories in the data. Always ground your responses in the actual data when possible.`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: question
        }]
      });

      return {
        response: message.content[0].text,
        usage: message.usage,
        success: true
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        response: "I'm having trouble accessing my knowledge right now. Please try again in a moment.",
        error: error.message,
        success: false
      };
    }
  }

  async findDocumentaryStories(criteria = {}) {
    try {
      // First, query the Intelligence database
      const stories = await this.intelligenceQuery.findDocumentaryStories({
        limit: criteria.limit || 5,
        minDocumentaryScore: criteria.minScore || 0.7,
        themes: criteria.themes,
        timeFrame: criteria.timeFrame
      });
      
      if (!stories || stories.length === 0) {
        return {
          stories: [],
          analysis: "No stories found matching your criteria. Try broadening your search parameters.",
          totalFound: 0
        };
      }

      // Then, enhance with Claude's narrative analysis
      const prompt = `Based on these ${stories.length} story candidates with documentary potential, provide a compelling summary for each, focusing on why they would make great documentaries. Consider narrative arc, visual possibilities, and audience appeal:

${stories.map((story, i) => `
${i + 1}. **${story.story.thread_title}**
   - Documentary Score: ${story.documentaryScore}
   - Time Period: ${story.story.start_date} to ${story.story.end_date}
   - Main Characters: ${story.mainCharacters.map(c => c.canonical_name).join(', ')}
   - Themes: ${story.story.primary_themes.join(', ')}
   - Production Complexity: ${story.story.production_complexity}
   - Archival Richness: ${story.story.archival_richness}
   - Evidence Count: ${story.story.evidence_count} pieces
`).join('\n')}

For each story, explain in 2-3 sentences:
1. Why it would be compelling for documentary audiences
2. What visual elements and archival materials are available
3. What makes it unique or dramatically engaging
4. Any potential challenges in telling this story

Keep your analysis concise but engaging, as if pitching to documentary producers.`;

      const analysisResult = await this.askJordi(prompt);
      
      return {
        stories,
        analysis: analysisResult.response,
        totalFound: stories.length,
        success: analysisResult.success,
        criteria: criteria
      };
    } catch (error) {
      console.error('Error finding documentary stories:', error);
      return {
        stories: [],
        analysis: "Unable to analyze stories at this time. Please try again.",
        totalFound: 0,
        success: false,
        error: error.message
      };
    }
  }

  async analyzeEntityRelationships(entityName, options = {}) {
    try {
      // Get relationship data from Intelligence database
      const relationships = await this.intelligenceQuery.getEntityRelationships(entityName, {
        includeEvidence: true,
        minDramaticTension: options.minTension || 0.5,
        limit: options.limit || 10
      });

      if (!relationships || relationships.length === 0) {
        return {
          entity: entityName,
          relationships: [],
          analysis: `No significant relationships found for ${entityName} in the Intelligence data.`,
          success: true
        };
      }

      const prompt = `Analyze the relationships for **${entityName}** based on this Intelligence data. Focus on the dramatic tension, historical significance, and storytelling potential:

${relationships.map((rel, i) => `
${i + 1}. **${rel.target_entity.canonical_name}** (${rel.relationship_type})
   - Dramatic Tension: ${rel.dramatic_tension}
   - Evidence: "${rel.evidence_text}"
   - Time Period: ${rel.temporal_context}
   - Context: ${rel.relationship_context}
`).join('\n')}

Provide:
1. A narrative summary of ${entityName}'s most significant relationships
2. Which relationships offer the strongest documentary potential
3. How these relationships could be woven into a compelling story
4. Any surprising or dramatic connections that stand out

Write as a historian who understands visual storytelling.`;

      const analysisResult = await this.askJordi(prompt);

      return {
        entity: entityName,
        relationships,
        analysis: analysisResult.response,
        totalRelationships: relationships.length,
        success: analysisResult.success
      };
    } catch (error) {
      console.error('Error analyzing entity relationships:', error);
      return {
        entity: entityName,
        relationships: [],
        analysis: "Unable to analyze relationships at this time.",
        success: false,
        error: error.message
      };
    }
  }

  async constructNarrativeTimeline(storyId, options = {}) {
    try {
      // Get temporal narrative data
      const timeline = await this.intelligenceQuery.constructTemporalNarrative(storyId, {
        includeDocumentaryMoments: true,
        minSignificance: options.minSignificance || 0.6
      });

      if (!timeline || timeline.events.length === 0) {
        return {
          storyId,
          timeline: [],
          analysis: "No timeline data available for this story.",
          success: true
        };
      }

      const prompt = `Create a compelling narrative timeline for this story based on the Intelligence data. Focus on documentary storytelling and visual opportunities:

**Story:** ${timeline.story.thread_title}
**Period:** ${timeline.story.start_date} to ${timeline.story.end_date}

${timeline.events.map((event, i) => `
${i + 1}. **${event.date}** - ${event.title}
   - Significance: ${event.significance_score}
   - Documentary Moment: ${event.is_documentary_moment ? 'Yes' : 'No'}
   - Visual Opportunities: ${event.visual_opportunities.join(', ')}
   - Key Players: ${event.entities.map(e => e.canonical_name).join(', ')}
   - Context: ${event.narrative_context}
`).join('\n')}

Provide:
1. A narrative arc that connects these events into a compelling story
2. Highlight the most cinematic/documentary moments
3. Suggest how to structure this for visual storytelling
4. Identify any gaps that might need additional research
5. Recommend the best "entry point" and "climax" for the documentary

Write for documentary producers planning a film.`;

      const analysisResult = await this.askJordi(prompt);

      return {
        storyId,
        timeline: timeline.events,
        story: timeline.story,
        analysis: analysisResult.response,
        totalEvents: timeline.events.length,
        documentaryMoments: timeline.events.filter(e => e.is_documentary_moment).length,
        success: analysisResult.success
      };
    } catch (error) {
      console.error('Error constructing narrative timeline:', error);
      return {
        storyId,
        timeline: [],
        analysis: "Unable to construct timeline at this time.",
        success: false,
        error: error.message
      };
    }
  }

  async getStoryContext(query, options = {}) {
    try {
      // Get comprehensive story context from Intelligence data
      const context = await this.intelligenceQuery.getComprehensiveStoryContext(query, {
        includeProductionPlanning: true,
        includeArchivalAssessment: true
      });

      const prompt = `Based on this comprehensive Intelligence data, provide a detailed story context analysis for: "${query}"

${context.articles ? `**Related Articles:** ${context.articles.length} found` : ''}
${context.entities ? `**Key Entities:** ${context.entities.length} identified` : ''}
${context.relationships ? `**Relationships:** ${context.relationships.length} connections` : ''}
${context.stories ? `**Story Threads:** ${context.stories.length} narrative threads` : ''}

${context.productionPlanning ? `
**Production Planning Data:**
- Archival Richness: ${context.productionPlanning.archival_richness}
- Visual Opportunities: ${context.productionPlanning.visual_opportunities}
- Interview Potential: ${context.productionPlanning.interview_potential}
- Production Complexity: ${context.productionPlanning.complexity_score}
` : ''}

Provide a comprehensive analysis including:
1. The main narrative threads and their documentary potential
2. Key characters and their stories
3. Historical context and significance
4. Production considerations (archival materials, visual elements)
5. Potential challenges and opportunities
6. Recommended approach for documentary treatment

Write as a research director briefing a documentary team.`;

      const analysisResult = await this.askJordi(prompt);

      return {
        query,
        context,
        analysis: analysisResult.response,
        success: analysisResult.success,
        dataQuality: {
          articles: context.articles?.length || 0,
          entities: context.entities?.length || 0,
          relationships: context.relationships?.length || 0,
          stories: context.stories?.length || 0
        }
      };
    } catch (error) {
      console.error('Error getting story context:', error);
      return {
        query,
        context: {},
        analysis: "Unable to provide story context at this time.",
        success: false,
        error: error.message
      };
    }
  }
}

export const jordiService = new JordiService(); 
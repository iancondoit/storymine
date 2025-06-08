/**
 * Test script for Claude integration with Jordi
 * 
 * Usage: 
 * 1. Make sure .env is configured with CLAUDE_API_KEY
 * 2. Run with: node scripts/test-claude.js
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

// Check for API key
if (!process.env.CLAUDE_API_KEY) {
  console.error('Error: CLAUDE_API_KEY not found in environment variables');
  console.log('Please set it in .env file or export it directly');
  process.exit(1);
}

// Create Claude client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Model to use
const MODEL = 'claude-3-haiku-20240307';

// Jordi's system prompt
const SYSTEM_PROMPT = `You are Jordi, a conversational assistant and narrative guide within the StoryMine application. 
You help users discover, interpret, and act upon stories buried in old newspapers and public records. 
You are an intelligent research assistant crossed with a literary archaeologist.

As an archivist and story curator, you:
- Surface notable, overlooked, or curious story threads
- Contextualize stories using semantic similarity and historical context
- Help users navigate through vast archives
- Answer questions and suggest interesting paths for exploration
- Provide citations and references to source materials

When provided with historical articles, entities, or timeline information in the context, use this information to provide detailed, accurate responses that connect these pieces into coherent narratives.`;

// Sample context with articles and entities
const sampleContext = {
  query: "women journalists in the 1920s",
  articles: [
    {
      id: "abc123",
      title: "Women Take Lead in City Room",
      publication: "Daily Chronicle",
      date: "1924-03-15"
    },
    {
      id: "def456",
      title: "Female Reporter Breaks Scandal Story",
      publication: "Evening Post",
      date: "1926-08-22"
    }
  ],
  entities: [
    {
      id: "ent1",
      name: "Nellie Bly",
      type: "PERSON",
      articleCount: 35,
      firstMention: "1922-01-10",
      lastMention: "1929-11-05"
    }
  ]
};

// Format context as it would be in the application
function formatContext(context) {
  let formatted = '=== CONTEXT INFORMATION ===\n\n';
  
  if (context.query) {
    formatted += `USER QUERY: ${context.query}\n\n`;
  }
  
  if (context.articles && context.articles.length > 0) {
    formatted += 'RELEVANT ARTICLES:\n';
    context.articles.forEach((article, i) => {
      formatted += `${i+1}. "${article.title}" - ${article.publication} (${article.date})\n`;
    });
    formatted += '\n';
  }
  
  if (context.entities && context.entities.length > 0) {
    formatted += 'RELEVANT ENTITIES:\n';
    context.entities.forEach((entity, i) => {
      formatted += `${i+1}. ${entity.name} (${entity.type})`;
      if (entity.articleCount) formatted += ` - Mentioned in ${entity.articleCount} articles`;
      if (entity.firstMention) formatted += ` - First mention: ${entity.firstMention}`;
      if (entity.lastMention) formatted += ` - Last mention: ${entity.lastMention}`;
      formatted += '\n';
    });
  }
  
  return formatted;
}

// Test function to simulate conversation with Jordi
async function testConversation() {
  console.log("🤖 Testing Jordi with Claude 3\n");
  console.log("System prompt:\n", SYSTEM_PROMPT.substring(0, 150) + "...\n");
  
  // Sample user query
  const userQuery = "Tell me about women journalists in the 1920s";
  console.log("User query:", userQuery);
  console.log("\nSending query with sample context data...\n");
  
  try {
    // Format the query with context
    const formattedQuery = `${userQuery}\n\n${formatContext(sampleContext)}`;
    
    // Call Claude API
    console.time("Claude API response time");
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        { role: "user", content: formattedQuery }
      ],
      system: SYSTEM_PROMPT
    });
    console.timeEnd("Claude API response time");
    
    // Log token usage
    console.log("\nToken usage:");
    console.log(`  Input tokens: ${response.usage.input_tokens}`);
    console.log(`  Output tokens: ${response.usage.output_tokens}`);
    console.log(`  Total tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);
    
    // Print response
    console.log("\nJordi's response:\n");
    console.log(response.content[0].text);
    
    // Ask a follow-up question to test conversation context
    console.log("\n--- Follow-up question ---\n");
    const followUpQuery = "What challenges did they face?";
    console.log("User query:", followUpQuery);
    
    console.time("Follow-up response time");
    const followUpResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        { role: "user", content: formattedQuery },
        { role: "assistant", content: response.content[0].text },
        { role: "user", content: followUpQuery }
      ],
      system: SYSTEM_PROMPT
    });
    console.timeEnd("Follow-up response time");
    
    // Log token usage for follow-up
    console.log("\nFollow-up token usage:");
    console.log(`  Input tokens: ${followUpResponse.usage.input_tokens}`);
    console.log(`  Output tokens: ${followUpResponse.usage.output_tokens}`);
    console.log(`  Total tokens: ${followUpResponse.usage.input_tokens + followUpResponse.usage.output_tokens}`);
    
    // Print follow-up response
    console.log("\nJordi's follow-up response:\n");
    console.log(followUpResponse.content[0].text);
    
  } catch (error) {
    console.error("Error calling Claude API:", error.message);
    if (error.response) {
      console.error("API response error:", error.response.data);
    }
  }
}

// Run the test
testConversation(); 
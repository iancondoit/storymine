# Claude Integration with Jordi

This document describes how to set up and use Claude 3 Sonnet with the Jordi assistant in StoryMine.

## Setup

1. **Get Claude API Key**
   - Sign up for an Anthropic API account at [console.anthropic.com](https://console.anthropic.com/)
   - Create a new API key in your account settings

2. **Configure Environment**
   - Create a `.env` file in the `backend` directory (based on `.env.sample`)
   - Add your Claude API key:
     ```
     CLAUDE_API_KEY=your_claude_api_key_here
     ```

3. **Install Dependencies**
   - Run `npm install` in the backend directory to install the latest Anthropic SDK

4. **Test the Integration**
   - Run the test script to verify your API key is working:
     ```
     cd backend
     node scripts/test-claude.js
     ```
   - You should see a successful response from Claude

## Using Jordi with Claude

### Features

The new Claude integration includes:

1. **Conversation History**
   - Jordi now remembers previous interactions within the same session
   - Conversations are stored with unique IDs for reference
   - Use the same conversation ID to continue a previous chat

2. **Enhanced Context Management**
   - Jordi better understands entities, articles, and timelines
   - Context is formatted for optimal Claude comprehension
   - Token usage tracking to monitor API consumption

3. **Conversation Management API**
   - Retrieve conversation history: `GET /api/conversations/:id`
   - Clear conversation history: `DELETE /api/conversations/:id`

### API Usage

#### Chat Endpoint

```
POST /api/chat
{
  "message": "User's message here",
  "conversationId": "optional-conversation-id"
}
```

Response:
```json
{
  "response": "Jordi's response text",
  "sources": [/* article sources */],
  "entities": [/* entity information */],
  "timeline": [/* timeline entries */],
  "conversation_id": "conversation-id",
  "token_usage": {
    "input": 123,
    "output": 456
  }
}
```

#### Conversation Management

Get conversation history:
```
GET /api/conversations/:id
```

Clear conversation history:
```
DELETE /api/conversations/:id
```

## Advanced Configuration

### System Prompt

The system prompt defines Jordi's personality and capabilities. You can modify it in `backend/src/services/claudeService.ts`.

### Claude Model Selection

The default model is `claude-3-sonnet-20240229`. You can change it in `backend/src/services/claudeService.ts` if you want to use a different Claude model.

### Conversation History Limits

By default, conversation history is limited to the last 10 exchanges. You can adjust this in `backend/src/services/claudeService.ts` by changing the `maxHistoryLength` property.

## Troubleshooting

1. **API Key Issues**
   - Verify your API key is correct
   - Check for proper environment variable loading
   - Make sure there are no extra spaces in your .env file

2. **Rate Limiting**
   - Claude has rate limits that may affect high-volume usage
   - Implement retry logic for production use

3. **Token Limit Errors**
   - Long conversations may exceed token limits
   - Consider summarizing or truncating context for very long exchanges

## Future Enhancements

- Implement streaming responses for faster user experience
- Add Claude tool use for more interactive capabilities
- Create parallel Claude queries for different information types
- Add support for Claude's JSON mode for structured responses 
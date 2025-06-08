# Simple AWS Deployment for StoryMine

**Target Cost:** $150-250/month  
**Setup Time:** 2-3 hours  
**Complexity:** Much simpler than the full enterprise setup

## What This Includes

✅ **Complete Web Application** (Frontend + Backend)  
✅ **LLM Integration** (Claude API for Jordi)  
✅ **Database** (PostgreSQL for Intelligence data)  
✅ **File Storage** (S3 for StoryMap Intelligence data)  
✅ **Domain & SSL** (Your existing domain)  
✅ **Auto-scaling** (scales with usage)

## Architecture (Simplified)

```
Internet → CloudFront → Elastic Beanstalk → RDS PostgreSQL
                     ↘ S3 (Intelligence Data)
```

## Step 1: Use Elastic Beanstalk (Much Simpler!)

Instead of complex ECS setup, use **Elastic Beanstalk** which handles everything:

```bash
# Install EB CLI
pip install awsebcli

# Initialize Elastic Beanstalk app
eb init storymine --platform "Docker running on 64bit Amazon Linux 2"

# Create environment
eb create storymine-production --instance-types t3.medium
```

## Step 2: Simple Dockerfile for Full Stack

Create `Dockerfile` in project root:

```dockerfile
# Multi-stage build for both frontend and backend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM node:18-alpine as backend-build
WORKDIR /app/backend
COPY src/backend/package*.json ./
RUN npm ci
COPY src/backend/ ./

# Final runtime image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend ./backend

# Copy frontend build
COPY --from=frontend-build /app/frontend/out ./frontend/out

# Install only production dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Expose port
EXPOSE 3001

# Start the backend (which serves frontend too)
CMD ["npm", "start"]
```

## Step 3: Database (Much Cheaper)

Use **RDS t3.micro** instead of r5.xlarge:

```bash
# Create small RDS instance
aws rds create-db-instance \
  --db-instance-identifier storymine \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20 \
  --db-name storymine \
  --master-username admin \
  --master-user-password your_password_here
```

## Step 4: LLM Integration (The Missing Piece!)

Update `src/backend/src/services/claudeService.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export class JordiService {
  async askJordi(question, context = {}) {
    const systemPrompt = `You are Jordi, a narrative archaeologist specializing in discovering lost stories from historical newspaper archives. You have access to StoryMap Intelligence data containing 282,387 enhanced articles, 1.4M entities, and 1.2M relationships from 1890-1950.

Your mission: Help users discover compelling stories with documentary potential.

Current Intelligence Data Context:
- Articles with narrative scoring and documentary potential
- Entities with biographical context and significance metrics
- Relationships with evidence and dramatic tension analysis
- Story threads optimized for visual storytelling

Respond as a knowledgeable but approachable historical researcher who finds the human stories in the data.`;

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: question
      }]
    });

    return message.content[0].text;
  }

  async findDocumentaryStories(criteria) {
    // First, query the Intelligence database
    const stories = await this.intelligenceQuery.findDocumentaryStories(criteria);
    
    // Then, enhance with Claude's narrative analysis
    const prompt = `Based on these ${stories.length} story candidates with documentary potential, provide a compelling summary for each, focusing on why they would make great documentaries:

${stories.map((story, i) => `
${i + 1}. **${story.story.thread_title}**
   - Documentary Score: ${story.documentaryScore}
   - Time Period: ${story.story.start_date} to ${story.story.end_date}
   - Main Characters: ${story.mainCharacters.map(c => c.canonical_name).join(', ')}
   - Themes: ${story.story.primary_themes.join(', ')}
   - Production Complexity: ${story.story.production_complexity}
`).join('\n')}

For each story, explain in 2-3 sentences why it would be compelling for documentary audiences, what visual elements are available, and what makes it unique.`;

    const analysis = await this.askJordi(prompt);
    
    return {
      stories,
      analysis,
      totalFound: stories.length
    };
  }
}
```

## Step 5: Configure Environment Variables

Create `.platform/nginx/conf.d/cors.conf`:
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Set environment variables in EB:
```bash
eb setenv CLAUDE_API_KEY=your_claude_key_here
eb setenv DATABASE_URL=postgresql://admin:password@your-rds-endpoint:5432/storymine
eb setenv NODE_ENV=production
eb setenv NEXT_PUBLIC_API_URL=https://storymine.yourdomain.com/api
```

## Step 6: Deploy

```bash
# Deploy to Elastic Beanstalk
eb deploy

# Point your domain to the EB environment
eb labs domain link yourdomain.com
```

## Realistic Cost Breakdown

### Simplified Architecture Costs:

- **Elastic Beanstalk** (t3.medium): $35/month
- **RDS PostgreSQL** (db.t3.micro): $15/month  
- **S3 Storage** (Intelligence data): $15/month
- **CloudFront CDN**: $5-15/month
- **Route 53 DNS**: $1/month
- **Data Transfer**: $5-20/month
- **Claude API**: $20-50/month (depending on usage)

**Total: $96-151/month** 🎉

### If You Need More Power Later:

- **Upgrade to t3.large**: +$35/month ($70 total for compute)
- **Upgrade DB to t3.small**: +$20/month ($35 total for DB)
- **Add Redis cache**: +$15/month

**Total with upgrades: $166-226/month**

## What About the Intelligence Data Import?

**Option 1: Manual Import** (Cheapest)
```bash
# Run import from your local machine once
npm run import:intelligence -- --data-dir ./storymine-data

# Or upload to S3 and import via EB
eb ssh
cd /var/app/current/backend
node scripts/importIntelligenceData.js --data-dir /tmp/intelligence-data
```

**Option 2: Scheduled Lambda** ($2-5/month)
- Small Lambda function that runs weekly to import new data
- Only runs when needed, very cost-effective

## Why This Is Much Better

**Simpler:**
- One command deployment with Elastic Beanstalk
- No complex ECS/Fargate setup
- Automatic load balancing and scaling

**Cheaper:**
- 85% cost reduction from the complex setup
- Pay only for what you use
- Easy to scale up later

**Complete:**
- Includes the LLM integration I missed
- Full web application hosting
- All the same functionality

**Production Ready:**
- SSL certificates automatically managed
- Auto-scaling based on traffic
- Health monitoring included

## Next Steps

1. **Try this simpler approach first** - get StoryMine running for $150/month
2. **Test with real users** - see how much traffic you actually get
3. **Scale up only if needed** - add more powerful instances later

Want me to walk you through setting this up? It's much more manageable than the enterprise version! 
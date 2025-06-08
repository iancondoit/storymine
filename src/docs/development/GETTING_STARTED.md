# Getting Started with StoryMine

This guide will walk you through setting up the StoryMine application and demonstrate a common development workflow.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Docker** and **Docker Compose**
- **Git**

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/storymine.git
cd storymine
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
cp backend/.env.example backend/.env
```

Edit the `.env` file to add your Claude API key (if available).

## Step 4: Start the Application with Docker

```bash
npm run docker:up
```

This will start:
- The backend server on port 3001
- The frontend on port 3000
- The Redis cache service
- Connect to the StoryMap API via Docker

## Step 5: Verify the Setup

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend health check: http://localhost:3001/health

## Example Workflow: Implementing a New Feature

Let's walk through the process of adding a new feature to StoryMine.

### 1. Create a Feature Branch

```bash
git checkout -b feature/timeline-view
```

### 2. Implement Backend API Endpoint

Add a new endpoint to retrieve timeline data in `backend/src/controllers/timelineController.js`:

```javascript
const { getArticlesByDateRange } = require('../services/storyMapApiClient');

async function getTimeline(req, res) {
  try {
    const { entityId, startDate, endDate } = req.query;
    
    // Validate parameters
    if (!entityId) {
      return res.status(400).json({ error: 'Entity ID is required' });
    }
    
    // Get articles from StoryMap API
    const articles = await getArticlesByDateRange(entityId, startDate, endDate);
    
    // Process articles into timeline format
    const timeline = articles.map(article => ({
      id: article.id,
      title: article.title,
      date: article.publication_date,
      source: article.publication,
      entityMentions: article.entities.filter(e => e.id === entityId).length
    }));
    
    res.json({
      entityId,
      timelinePoints: timeline
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to retrieve timeline data' });
  }
}

module.exports = {
  getTimeline
};
```

### 3. Register the Route

Add the route in `backend/src/routes/index.js`:

```javascript
const timelineController = require('../controllers/timelineController');

// ... existing code ...

router.get('/timeline', timelineController.getTimeline);

// ... existing code ...
```

### 4. Implement Frontend Component

Create a new timeline component in `frontend/src/components/timeline/Timeline.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Timeline({ entityId }) {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!entityId) return;
    
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/timeline?entityId=${entityId}`);
        setTimelineData(response.data.timelinePoints);
        setLoading(false);
      } catch (err) {
        setError('Failed to load timeline data');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchTimeline();
  }, [entityId]);
  
  if (loading) return <div>Loading timeline...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="timeline-container">
      <h2>Timeline for Entity</h2>
      <div className="timeline">
        {timelineData.map(point => (
          <div key={point.id} className="timeline-point">
            <div className="timeline-date">{new Date(point.date).toLocaleDateString()}</div>
            <div className="timeline-content">
              <h3>{point.title}</h3>
              <p>Source: {point.source}</p>
              <p>Mentions: {point.entityMentions}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Add the Component to a Page

Update the entity detail page in `frontend/src/pages/entity/[id].jsx` to include the timeline:

```jsx
import Timeline from '../../components/timeline/Timeline';

// ... existing code ...

export default function EntityDetail({ entityId }) {
  // ... existing code ...
  
  return (
    <div className="entity-detail-page">
      <h1>{entity.name}</h1>
      <div className="entity-metadata">
        {/* ... existing entity metadata ... */}
      </div>
      
      {/* Add the timeline component */}
      <Timeline entityId={entityId} />
      
      {/* ... rest of the page ... */}
    </div>
  );
}
```

### 6. Test the Feature

1. Make sure your Docker containers are running
2. Navigate to an entity detail page
3. Verify that the timeline is displayed correctly
4. Test different entities to ensure data is loading properly

### 7. Commit Your Changes

```bash
git add .
git commit -m "Add timeline view for entities"
git push origin feature/timeline-view
```

### 8. Create a Pull Request

Open a pull request to merge your changes into the main branch.

## Common Development Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run only backend tests
npm run backend:test

# Run only frontend tests
npm run frontend:test
```

### Debugging

For backend debugging, you can inspect logs:

```bash
docker-compose logs -f backend
```

For frontend debugging:
- Use React Developer Tools browser extension
- Check browser console for errors
- Add `console.log()` statements in your components

### Stopping the Application

```bash
npm run docker:down
```

## Next Steps

Now that you're set up, you might want to explore:

1. [API Documentation](API_DOCUMENTATION.md) to understand available endpoints
2. [Tech Stack](TECH_STACK.md) for details on the technologies used
3. [Project Background](PROJECT_BACKGROUND.md) to understand the purpose of StoryMine
4. [Jordi Enhancement Plan](../jordi/JORDI_ENHANCEMENT_PLAN.md) to learn about the AI assistant 
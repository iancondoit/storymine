#!/usr/bin/env python3
"""
Script to start the StoryMap API server for local development.
This creates a mock StoryMap API server with sample data for StoryMine development.
"""

import json
import os
import sys
import uuid
from datetime import datetime
from flask import Flask, jsonify, request, abort

# Create Flask app
app = Flask(__name__)

# Sample data
ARTICLES = [
    {
        "id": str(uuid.uuid4()),
        "title": "Roosevelt Begins Third Term as War Looms",
        "content": "President Franklin D. Roosevelt was inaugurated for an unprecedented third term today, as war continues to rage in Europe and tensions with Japan increase in the Pacific. In his address, Roosevelt emphasized the importance of American preparedness while maintaining his commitment to keeping the nation out of foreign conflicts.",
        "category": "politics",
        "publication_date": "1941-01-20",
        "source": "The Daily Chronicle",
        "is_advertisement": False,
        "quality_score": 0.92,
        "word_count": 1250
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Churchill and Roosevelt Meet Aboard Warships",
        "content": "Prime Minister Winston Churchill and President Franklin D. Roosevelt concluded a secret meeting aboard naval vessels in the Atlantic Ocean yesterday, issuing what is being called the \"Atlantic Charter\" - a joint declaration of post-war aims that emphasizes self-determination for all nations and economic cooperation.",
        "category": "international",
        "publication_date": "1941-08-14",
        "source": "The Evening Star",
        "is_advertisement": False,
        "quality_score": 0.89,
        "word_count": 950
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Roosevelt Declares War After Pearl Harbor Attack",
        "content": "In an address to Congress that will surely echo through history, President Roosevelt called December 7, 1941 \"a date which will live in infamy\" as he asked for and received a declaration of war against the Empire of Japan following the surprise attack on Pearl Harbor, Hawaii.",
        "category": "war",
        "publication_date": "1941-12-08",
        "source": "The Morning Herald",
        "is_advertisement": False,
        "quality_score": 0.95,
        "word_count": 1100
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Civil Rights Leaders Meet at White House",
        "content": "A delegation of civil rights leaders including A. Philip Randolph and Walter White met with President Roosevelt today to discuss racial discrimination in defense industries. The meeting comes amid growing tensions and threats of a massive march on Washington to protest segregation in the military and defense sectors.",
        "category": "civil rights",
        "publication_date": "1941-06-18",
        "source": "The People's Voice",
        "is_advertisement": False,
        "quality_score": 0.88,
        "word_count": 875
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Women Join Workforce as War Production Accelerates",
        "content": "Factories across the nation are seeing an unprecedented influx of female workers as war production ramps up and millions of men join the armed forces. \"Rosie the Riveter\" has become a symbol of the American woman's contribution to the war effort, with government campaigns actively encouraging women to take up industrial jobs.",
        "category": "society",
        "publication_date": "1942-07-30",
        "source": "Industrial Times",
        "is_advertisement": False,
        "quality_score": 0.85,
        "word_count": 920
    }
]

ENTITIES = [
    {"id": str(uuid.uuid4()), "name": "Franklin D. Roosevelt", "entity_type": "person"},
    {"id": str(uuid.uuid4()), "name": "Winston Churchill", "entity_type": "person"},
    {"id": str(uuid.uuid4()), "name": "Pearl Harbor", "entity_type": "location"},
    {"id": str(uuid.uuid4()), "name": "World War II", "entity_type": "event"},
    {"id": str(uuid.uuid4()), "name": "White House", "entity_type": "location"},
    {"id": str(uuid.uuid4()), "name": "A. Philip Randolph", "entity_type": "person"},
    {"id": str(uuid.uuid4()), "name": "Walter White", "entity_type": "person"},
    {"id": str(uuid.uuid4()), "name": "Atlantic Charter", "entity_type": "event"}
]

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "server": "StoryMap API (Mock)",
        "time": datetime.now().isoformat()
    })

# Get articles
@app.route('/api/articles', methods=['GET'])
def get_articles():
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    filtered_articles = ARTICLES[offset:offset+limit]
    
    return jsonify({
        "articles": filtered_articles,
        "limit": limit,
        "offset": offset,
        "total": len(ARTICLES)
    })

# Get single article
@app.route('/api/articles/<article_id>', methods=['GET'])
def get_article(article_id):
    article = next((a for a in ARTICLES if a["id"] == article_id), None)
    
    if not article:
        abort(404, description="Article not found")
        
    # Add some entities to the article
    article_entities = [e for e in ENTITIES if e["name"].lower() in article["content"].lower()]
    
    # Make a deep copy to avoid modifying the original
    result = article.copy()
    result["entities"] = article_entities
    
    return jsonify(result)

# Entities endpoint
@app.route('/api/entities', methods=['GET'])
def get_entities():
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    filtered_entities = ENTITIES[offset:offset+limit]
    
    return jsonify({
        "entities": filtered_entities,
        "limit": limit,
        "offset": offset
    })

# Entities by type endpoint
@app.route('/api/entities/<entity_type>', methods=['GET'])
def get_entities_by_type(entity_type):
    limit = request.args.get('limit', default=10, type=int)
    offset = request.args.get('offset', default=0, type=int)
    
    filtered_entities = [e for e in ENTITIES if e["entity_type"] == entity_type]
    result = filtered_entities[offset:offset+limit]
    
    return jsonify({
        "entities": result,
        "limit": limit,
        "offset": offset
    })

# Search endpoint
@app.route('/api/search', methods=['POST'])
def search():
    data = request.json
    
    if not data or 'query' not in data:
        abort(400, description="Query is required")
        
    query = data['query'].lower()
    limit = data.get('limit', 10)
    
    print(f"Received search query: {query}")
    
    # Improved search implementation
    results = []
    
    # Handle common misspellings of key terms
    search_terms = []
    if "roosevelt" in query or "roosvelt" in query or "roosavelt" in query or "fdr" in query:
        search_terms.append("roosevelt")
    if "churchill" in query or "churchil" in query:
        search_terms.append("churchill")
    if "world war" in query or "ww2" in query:
        search_terms.append("war")
    if "pearl harbor" in query:
        search_terms.append("pearl harbor")
    
    # If no specific terms were identified, use the original query
    if not search_terms:
        search_terms = [query]
    
    print(f"Searching for terms: {search_terms}")
    
    # Search in title and content
    for article in ARTICLES:
        title_lower = article['title'].lower()
        content_lower = article['content'].lower()
        
        # Check if any term matches
        for term in search_terms:
            if term in title_lower or term in content_lower:
                # Create a copy with similarity score
                result = article.copy()
                
                # Set higher similarity score for title matches
                if term in title_lower:
                    result['similarity'] = 0.95
                else:
                    result['similarity'] = 0.85
                
                results.append(result)
                break  # No need to check other terms for this article
    
    # Sort by similarity score
    results.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Limit results
    results = results[:limit]
    
    print(f"Found {len(results)} matching articles")
    
    return jsonify({
        "query": data['query'],
        "results": results
    })

# Filter endpoint
@app.route('/api/filter', methods=['POST'])
def filter_articles():
    data = request.json
    
    if not data:
        abort(400, description="Filter criteria required")
        
    # Extract filter criteria
    categories = data.get('categories', [])
    date_range = data.get('date_range', {})
    start_date = date_range.get('start')
    end_date = date_range.get('end')
    page = data.get('page', 1)
    limit = data.get('limit', 10)
    
    # Apply filters
    filtered = ARTICLES.copy()
    
    if categories:
        filtered = [a for a in filtered if a['category'] in categories]
        
    if start_date:
        filtered = [a for a in filtered if a['publication_date'] >= start_date]
        
    if end_date:
        filtered = [a for a in filtered if a['publication_date'] <= end_date]
    
    # Apply pagination
    offset = (page - 1) * limit
    paginated = filtered[offset:offset+limit]
    
    return jsonify({
        "articles": paginated,
        "total": len(filtered),
        "page": page,
        "limit": limit
    })

if __name__ == '__main__':
    # Default port is 5001 to avoid conflicts with macOS Control Center (5000)
    port = int(os.environ.get('PORT', 5001))
    
    print(f"Starting StoryMap Mock API Server on port {port}")
    print(f"API will be available at http://localhost:{port}")
    print("Press Ctrl+C to quit")
    
    # Start server
    app.run(host='0.0.0.0', port=port, debug=True) 
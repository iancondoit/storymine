# StoryMine Project Background

This document provides background information on the StoryMine project, including what StoryMap is and the purpose of the Jordi AI assistant.

## What is StoryMine?

StoryMine is a web application designed to help users explore and discover historical narratives through newspaper archives. The application combines modern web technologies with artificial intelligence to provide an intuitive interface for exploring vast collections of historical articles.

The name "StoryMine" reflects the application's purpose: to help users "mine" for compelling stories in historical data, much like extracting valuable minerals from a mine. The application presents historical data with a genomic/scientific aesthetic to emphasize the data-driven approach to discovering historical narratives.

## What is StoryMap?

StoryMap is the underlying data processing system that powers StoryMine. It consists of:

1. **ETL Pipeline**: A data extraction, transformation, and loading pipeline that processes historical newspaper articles from various sources
2. **Entity Recognition**: Advanced natural language processing to identify people, places, organizations, and events
3. **Relationship Mapping**: Algorithms that discover connections between entities across articles
4. **Vector Database**: A system that converts article content into vector embeddings for semantic search
5. **API Layer**: A RESTful API that provides access to articles, entities, relationships, and search capabilities

StoryMap processes raw historical newspaper content and transforms it into structured data with rich semantic information. This structured data is what enables StoryMine to provide powerful search, exploration, and visualization features.

### StoryMap API

The StoryMap API is the interface between StoryMine and the processed historical data. It provides endpoints for:

- Retrieving articles and their metadata
- Accessing entity information
- Exploring relationships between entities
- Performing semantic searches
- Generating timelines and networks

In the development environment, StoryMine connects to the StoryMap API through Docker, which simplifies setup and ensures consistent behavior across development environments.

## Who is Jordi?

Jordi is an AI assistant integrated into StoryMine. The name and persona are inspired by the concept of a meticulous archivist and newsroom librarian who has deep knowledge of historical events and connections.

### Jordi's Purpose

Jordi serves several key purposes in StoryMine:

1. **Knowledge Interface**: Jordi provides a natural language interface to the historical data, allowing users to ask questions in plain English rather than constructing complex queries
2. **Narrative Discovery**: Jordi helps users discover compelling narratives by identifying connections and patterns that might not be obvious
3. **Research Assistant**: Jordi assists researchers by providing relevant context, suggesting related content, and summarizing findings
4. **Contextual Understanding**: Jordi understands the historical context of events, helping users place articles in their proper historical perspective

### How Jordi Works

Jordi is powered by Anthropic's Claude AI model, specifically the Claude 3 Sonnet variant. When a user interacts with Jordi:

1. The user's query is sent to the backend
2. The backend retrieves relevant articles and entities from the StoryMap API
3. This context, along with the user's query, is sent to the Claude API
4. Claude generates a response based on the query and provided context
5. The response is enhanced with entity information and article sources
6. The enhanced response is returned to the user

Jordi is designed to be entity-aware, meaning it can recognize and provide information about people, places, organizations, and events mentioned in user queries. This entity awareness enables Jordi to provide richer, more contextual responses.

## Core Use Cases

StoryMine and Jordi are designed to support several core use cases:

### 1. Historical Research

Researchers can use StoryMine to explore primary sources related to specific historical events, figures, or time periods. Jordi assists by providing relevant context and suggesting connections between sources.

**Example**: A historian researching World War II can ask Jordi about specific battles, political decisions, or the home front, and receive information based on contemporary newspaper accounts.

### 2. Story Creation

Journalists, documentary filmmakers, and other storytellers can use StoryMine to discover compelling historical narratives. Jordi helps by identifying narrative threads and dramatic arcs within the historical data.

**Example**: A documentary filmmaker can ask Jordi about the civil rights movement in a specific city, and Jordi will help identify key events, figures, and turning points based on newspaper coverage.

### 3. Educational Exploration

Students and educators can use StoryMine as a tool for exploring historical periods. Jordi provides an engaging, conversational interface that makes historical exploration more accessible.

**Example**: A high school history class can explore how World War II was reported in real-time, with Jordi helping to place events in context and highlight different perspectives.

### 4. Entity Network Exploration

Researchers interested in connections between historical figures, organizations, and places can use StoryMine to visualize and explore these relationships. Jordi helps explain the significance of these connections.

**Example**: A researcher can ask about Franklin D. Roosevelt's cabinet members and their relationships with business leaders, with Jordi providing insights based on newspaper coverage of these relationships.

## Historical Data Approach

StoryMine is built on the principle that historical newspapers provide a unique window into the past - they show not just what happened, but how events were perceived and reported at the time they occurred.

Key aspects of our approach to historical data include:

1. **Primary Sources Focus**: StoryMine emphasizes primary sources (newspaper articles) rather than secondary interpretations
2. **Temporal Context**: Articles are presented with clear temporal context, helping users understand how events unfolded in real-time
3. **Multiple Perspectives**: Where available, StoryMine includes articles from different publications to provide varying perspectives on events
4. **Entity-Centric View**: By identifying and connecting entities across articles, StoryMine enables users to follow specific people, places, or organizations through time

## Project Vision

The long-term vision for StoryMine includes:

1. **Expanded Data Sources**: Incorporating additional historical newspapers, magazines, and other primary sources
2. **Enhanced Visualization**: More sophisticated timeline, network, and geographic visualizations
3. **Advanced AI Capabilities**: Further enhancing Jordi's ability to understand historical context and identify narrative patterns
4. **Collaborative Features**: Enabling users to save, share, and collaborate on research projects
5. **Multimedia Integration**: Incorporating historical photos, audio, and video where available

StoryMine aims to transform how people interact with historical archives, making rich primary source material more accessible and engaging through modern technology and artificial intelligence. 
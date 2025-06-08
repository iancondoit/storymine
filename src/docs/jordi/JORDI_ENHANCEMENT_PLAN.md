# Jordi Enhancement Plan

## Overview

This document outlines Jordi's role within the StoryMine platform and our roadmap for enhancing Jordi's capabilities once the improved data from StoryMap becomes available.

## Who is Jordi?

Jordi is a conversational assistant and narrative guide within the StoryMine application. She is not just a chatbot or a Q&A interface; she's a persistent, contextual explorer of historical archives designed to help users uncover, interpret, and act upon the latent stories buried in old newspapers and other public records. Think of her as an intelligent research assistant crossed with a literary archaeologist.

### Jordi's Core Functions

1. **Archivist and Story Curator**
   - Combs through vast quantities of processed archival material
   - Surfaces notable, overlooked, or curious story threads
   - Contextualizes stories using semantic similarity, historical embeddings, and narrative fingerprints

2. **Guide and Navigator**
   - Provides a starting point for users overwhelmed by hundreds of thousands of articles
   - Suggests themes or entry points (e.g., "Want to explore forgotten women in journalism?")
   - Helps users zoom in and out of story arcs, character timelines, and regional patterns
   - Explains the interface itself

3. **Conversational Research Assistant**
   - Answers questions and helps refine them
   - Clarifies vague interests into specific research directions
   - Offers metadata, citations, and counterpoints

4. **Story Catalyst**
   - Acts as a bridge to action for various user groups
   - Helps turn interesting threads into treatments, outlines, or research packets
   - Assists in extracting summaries or timelines
   - Generates data exports for further analysis

## Target Users

1. **Researchers and Historians**
   - Looking for forgotten patterns or long-form story arcs
   - Need help identifying public policy failures or corporate malfeasance over time

2. **Documentarians and Journalists**
   - Need help quickly spotting compelling stories with a beginning, middle, and end
   - Looking for stories with emotional or societal stakes

3. **Writers and Creators**
   - Novelists, screenwriters, or podcasters looking for story kernels
   - Seeking real-life events that can spark fictional or dramatized adaptations

4. **Educators and Students**
   - Want to explore local history, journalism trends, or thematic studies
   - Use the platform for educational purposes

5. **Civic Technologists and Public Institutions**
   - Study long-term urban trends, crime patterns, or infrastructure issues
   - Need to make sense of historical public data

## Why Jordi Matters

- Archives are dense, messy, and intimidating; Jordi provides guidance
- Enables active, semantic exploration beyond simple keyword searches
- Connects fragments across time and publications to surface deeper insights
- Maintains creative and research momentum that might otherwise be lost
- Democratizes access to complex data for users without technical query skills

As StoryMine CEO Ian Hoppe put it: "If StoryMine is the lens through which we explore the past, then Jordi is the hand on the telescope, steadily guiding our view."

## Enhancement Plan

After StoryMap data improvements are implemented, we will enhance Jordi in the following phases:

### Phase 1: Entity-Aware Jordi

**When:** After StoryMap implements entity recognition

**Enhancements:**
- Enable Jordi to understand and track named entities (people, places, organizations)
- Develop entity-centric storytelling capabilities
- Create visualization tools for entity relationships
- Allow queries like "Who was Mayor of Atlanta in 1920?" or "Track the career of this journalist"

**Technical Requirements:**
- Integration with StoryMap's entity API endpoints
- Entity resolution and disambiguation logic
- Entity-based search and filtering interfaces
- Entity timeline generation

### Phase 2: Relationship-Enhanced Jordi

**When:** After StoryMap implements relationship mapping

**Enhancements:**
- Enable Jordi to understand connections between entities
- Develop network visualization of related stories and entities
- Create "six degrees of separation" discovery features
- Support queries like "How is this person connected to that organization?"

**Technical Requirements:**
- Relationship graph data structures
- Network visualization components
- Relationship-based recommendation algorithms
- Connection path finding algorithms

### Phase 3: Topical Jordi

**When:** After StoryMap implements content classification and categorization

**Enhancements:**
- Enable Jordi to understand topics and themes across articles
- Develop topic clustering and theme identification
- Create thematic story arcs across time
- Support queries like "Show me the evolution of environmental concerns in the 1920s"

**Technical Requirements:**
- Topic modeling integration
- Temporal theme tracking
- Topic visualization components
- Theme-based recommendation algorithms

### Phase 4: Narrative Jordi

**When:** After StoryMap completes content processing improvements

**Enhancements:**
- Enable Jordi to understand narrative structures and story arcs
- Develop automated story summarization and expansion
- Create story arc visualization and comparison tools
- Support queries like "Find me stories with similar narrative patterns"

**Technical Requirements:**
- Narrative pattern recognition
- Story arc modeling
- Narrative visualization components
- Story similarity algorithms

## Implementation Approach

1. **Data Integration Layer**
   - Create adapters for new StoryMap API capabilities as they become available
   - Develop caching strategies for entity and relationship data
   - Implement incremental feature activation

2. **Conversation Design**
   - Expand Jordi's conversational capabilities to leverage new data
   - Design prompts that guide users to new capabilities
   - Create educational sequences to introduce new features

3. **UI Components**
   - Develop new visualization components for entities, relationships, and stories
   - Create interactive exploration tools
   - Design contextual help for new features

4. **User Testing**
   - Conduct regular user testing as new features are developed
   - Gather feedback on usefulness and usability
   - Iterate based on real-world usage patterns

## Success Metrics

- Increased user engagement time
- Higher number of stories discovered per session
- Increased export/save actions
- User feedback on story quality and relevance
- Diversity of exploration paths taken
- Return usage rates 
# StoryMine Glossary

This document provides definitions for domain-specific terms used in the StoryMine project.

## A

### API
**Application Programming Interface**. A set of rules and protocols that allows different software applications to communicate with each other. In StoryMine, the backend provides an API that the frontend uses to retrieve data, and the StoryMap API provides data to the backend.

### Article
A newspaper article from the historical archives. Articles are the primary content units in StoryMine and contain text, metadata, and entity references.

## C

### Claude
The large language model (LLM) from Anthropic that powers the Jordi AI assistant. StoryMine specifically uses the Claude 3 Sonnet variant.

### Content Embedding
A vector representation of article text that enables semantic search. Content embeddings are high-dimensional numerical representations that capture the semantic meaning of text.

## D

### Docker
A platform used to develop, ship, and run applications inside containers. StoryMine uses Docker to ensure consistent development environments and to simplify the integration with the StoryMap API.

## E

### Entity
A named object of interest identified in articles, such as a person, place, organization, or event. Entities are extracted from articles and can be linked across multiple articles to form relationships.

### Entity Network
A visualization showing relationships between different entities based on their co-occurrence in articles. The network displays entities as nodes and their relationships as edges.

### Entity Type
The category of an entity, such as "person," "location," "organization," or "event." Entity types help organize and filter entities in the application.

### ETL Pipeline
**Extract, Transform, Load**. The process used by StoryMap to extract data from raw sources, transform it into a structured format, and load it into the database. The ETL pipeline processes newspaper archives to prepare them for use in StoryMine.

## J

### Jordi
The AI assistant in StoryMine, powered by Claude. Jordi helps users explore historical narratives by providing context, suggesting connections, and answering questions about historical content.

### JWT
**JSON Web Token**. A compact, URL-safe means of representing claims between two parties. Used for authentication in StoryMine's API.

## N

### Next.js
A React framework used for building the frontend of StoryMine. Next.js provides features like server-side rendering, static site generation, and API routes.

## P

### Publication
A newspaper or periodical source from which articles are collected. Articles in StoryMine are associated with specific publications, which helps provide context and source information.

## R

### Relationship
A connection between two entities based on their co-occurrence in articles. Relationships have types (such as "works_for," "located_in") and confidence scores that indicate the strength of the connection.

### Retrieval-Augmented Generation (RAG)
The technique used by Jordi to provide accurate responses based on the historical archive. RAG combines retrieval of relevant articles and information with generation of natural language responses.

## S

### Semantic Search
A search method that understands the intent and contextual meaning of search terms, rather than just matching keywords. StoryMine uses vector embeddings to enable semantic search capabilities.

### StoryMap
The underlying data processing system that powers StoryMine. StoryMap processes historical newspapers, extracting entities, relationships, and generating vector embeddings for semantic search.

### StoryMap API
The API that provides access to the processed historical data, including articles, entities, and relationships. StoryMine connects to the StoryMap API through Docker.

### StoryMine
The web application that provides an interface for exploring historical narratives. StoryMine consists of a frontend, backend, and integration with the StoryMap API.

## T

### Timeline
A chronological visualization of articles related to a specific entity, topic, or search query. Timelines help users understand how events unfolded over time.

### Token
In the context of language models, a token is a chunk of text that the model processes. Tokens can be words, parts of words, or punctuation. Claude has limits on the number of tokens it can process in a single request.

## V

### Vector Database
A database optimized for storing and querying vector embeddings. StoryMap uses a vector database to enable semantic search of articles based on their content.

### Vector Embedding
A numerical representation of text or other data in a high-dimensional space. In StoryMine, articles are converted to vector embeddings to enable semantic similarity search.

### Vector Search
A search method that finds items based on the similarity of their vector embeddings. This allows finding articles that are semantically similar even if they don't share the same keywords.

## W

### Word Count
The number of words in an article. Word count is used as a metric for article length and can be used to filter articles in search results.

## Common Acronyms

| Acronym | Definition |
|---------|------------|
| API | Application Programming Interface |
| ETL | Extract, Transform, Load |
| JWT | JSON Web Token |
| LLM | Large Language Model |
| NLP | Natural Language Processing |
| RAG | Retrieval-Augmented Generation |
| SSR | Server-Side Rendering |
| UI | User Interface |
| UX | User Experience | 
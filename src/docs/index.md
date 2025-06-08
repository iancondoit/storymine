# StoryMine Documentation

This is the central documentation hub for the StoryMine project. This documentation is organized into multiple sections:

## Development Documentation

Documentation related to project status, roadmap, development plans, and architecture:

- [Project Status](development/PROJECT_STATUS.md)
- [StoryMine Roadmap](development/STORYMINE_ROADMAP.md)
- [Development Plan](development/DEVELOPMENT_PLAN.md)
- [Docker Setup](development/DOCKER_SETUP.md)
- [Architecture](development/ARCHITECTURE.md) - *Overview of system architecture with diagrams*
- [Tech Stack](development/TECH_STACK.md) - *Comprehensive list of technologies used*
- [API Documentation](development/API_DOCUMENTATION.md) - *Endpoints, parameters, and responses*
- [Local Development Guide](development/LOCAL_DEVELOPMENT.md) - *Setting up and working with the codebase*
- [Troubleshooting](development/TROUBLESHOOTING.md) - *Solutions for common issues*
- [Sample Data](development/SAMPLE_DATA.md) - *Information about test data available*
- [Project Background](development/PROJECT_BACKGROUND.md) - *About StoryMap and Jordi's purpose*
- [Environment Variables](development/ENVIRONMENT_VARIABLES.md) - *Configuration reference*
- [Glossary](development/GLOSSARY.md) - *Domain-specific terminology*

## Jordi AI Assistant Documentation

Documentation related to the Jordi AI assistant:

- [Entity-Aware Jordi](jordi/ENTITY_AWARE_JORDI.md)
- [Jordi Enhancement Plan](jordi/JORDI_ENHANCEMENT_PLAN.md)
- [Claude Integration](jordi/CLAUDE_INTEGRATION.md)

## StoryMap API Integration Documentation

Documentation related to StoryMap API integration:

- [StoryMap Integration Guide](storymap/STORYMAP_INTEGRATION_GUIDE.md)
- [StoryMap Integration Progress](storymap/STORYMAP_INTEGRATION_PROGRESS.md)
- [StoryMap API Documentation](storymap/STORYMAP_API.md)
- [StoryMap Enhancements](storymap/STORYMAP_ENHANCEMENTS.md)

## Getting Started

If you're new to the project, we recommend starting with the following documents:

1. [Project Background](development/PROJECT_BACKGROUND.md) - To understand what StoryMine is about
2. [Architecture](development/ARCHITECTURE.md) - To get a high-level overview of the system
3. [Getting Started](development/LOCAL_DEVELOPMENT.md) - To set up your development environment
4. [Tech Stack](development/TECH_STACK.md) - To learn about the technologies used
5. [API Documentation](development/API_DOCUMENTATION.md) - To understand the available endpoints

## Quick Links

- [GitHub Repository](https://github.com/yourusername/storymine)
- [Latest Release](https://github.com/yourusername/storymine/releases/latest)
- [Current Version: 1.2.0](#)
- [Docker Hub Image](https://hub.docker.com/r/yourusername/storymine)

## Documentation Maintenance

This documentation is maintained as part of the StoryMine project. If you find any issues or have suggestions for improvements, please [open an issue](https://github.com/yourusername/storymine/issues) or submit a pull request.

## Running the Application

Please refer to the main [README.md](../README.md) in the project root for instructions on installation and running the application.

### Key Commands

- Start with Docker: `npm run docker:up`
- Stop Docker: `npm run docker:down`
- Local development: `npm run dev`
- Run tests: `npm test`
- Test Docker API: `npm run test:docker-api` 
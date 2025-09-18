# Perpus-Apps Backend

Backend for the Perpus-Apps application.

## Project Structure

The backend is structured in a microservices-like architecture. Each feature is organized into its own directory, containing its controller, router, and service.

- **src/**
  - **analytics/**: Handles analytics-related endpoints.
  - **books/**: Manages all book-related operations, including CRUD, file uploads, and searching.
  - **genres/**: Provides endpoints for fetching book genres.
  - **languages/**: Provides endpoints for fetching book languages.
  - **logs/**: Manages logging functionalities.
  - **middleware/**: Contains custom middleware used in the application.
  - **sse/**: Handles Server-Sent Events for real-time updates.
  - **stats/**: Provides endpoints for application statistics.
  - **lib/**: Contains shared libraries and utility functions.
  - `index.ts`: The main entry point of the application.

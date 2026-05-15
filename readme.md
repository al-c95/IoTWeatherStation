# 🌦️ IoT Weather Station

## Introduction
IoT weather station implemented using **ESP32 microcontroller–based sensor nodes**, a **Node.JS** web service (weather-core), a **FastAPI** web service (weather-analysis), and a **React web UI frontend** (weather-portal).  
Designed to operate as a **backyard hobby weather station**, collecting live temperature, humidity, and other environmental data.  
May be integrated into a future **smart home hub**.

## Project Approach
This project is managed as a **hybrid systems engineering and agile software** project:

- [**Concept Design**](docs/concept_design.md) — describes the high-level architecture and requirements, and serves as a baseline for implementation. Changes infrequently.  
- **Detailed Design** — describes the software implementation at a lower level. A *living* document that may evolve frequently as features are added or refined.

### Development and Test Plan
High-level system requirements in the [**Concept Design**](docs/concept_design.md) are traced to requirements in the **Detailed Design**.  
Detailed design requirements are further traced to **test cases**, written as features are developed.

#### Testing Strategy
Before each major revision or release, the following test cycles are performed:

- **Unit Tests** — Validate individual components of the firmware, backend, and UI.  
  *Target: ≥70% code coverage.*
- **Integration Tests** — Verify interactions between major software components (e.g., weather-core and weather-analysis endpoints tested using Postman, SoapUI, or simulator scripts).
- **End-to-End Tests** — Acceptance tests run with the full software stack, validating complete user flows.

#### Development Guidelines
- Commit messages should be descriptive and follow the format: `type(scope): description` (e.g., `feat(sensor_nodes): add new temperature sensor support`).
- Branches should be named according to the feature or bug being worked on (e.g., `feature/add-rainfall-sensor`, `bugfix/fix-data-logging`).

### Repo structure
`sensor_nodes` - ESP-IDF projects for sensor nodes.

`weather-core` - Node.JS web server.

`weather-analysis` - FastAPI web server.

`web-portal` - React frontend.

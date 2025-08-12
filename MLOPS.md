# MLOps and Production Deployment Architecture

This document outlines the MLOps (Machine Learning Operations) and cloud deployment architecture for Synapse AI. This design ensures that the application is scalable, reliable, and maintainable, following best practices for production-grade AI systems.

## Unified End-to-End Architecture Diagram

The following diagram illustrates the complete, automated workflow, from a code change in a Git repository to a globally available, scalable application running on Cloud Run, while also showing the internal components of the application itself.

![Unified Architecture Diagram](https://placehold.co/1200x800.png)
_This diagram shows the flow from Code Commit -> Cloud Build (Test, Build, Push) -> Artifact Registry -> Cloud Run Deployment. It details the running application's interaction with external services via the proprietary **Synapse Wrapper API**._

## Core Components & Workflow

The entire process is automated via a CI/CD pipeline defined in `cloudbuild.yaml`.

### 1. Source Control (e.g., GitHub)
The process begins when a developer pushes code changes (from the `src` directory) to a central Git repository. This action automatically triggers the CI/CD pipeline.

### 2. Docker Containerization (`Dockerfile`)
The Next.js/Genkit application is packaged into a **Docker container**. This creates a standardized, portable unit that includes the application code, dependencies (`package.json`), and the Node.js runtime environment. Containerization guarantees consistency across all environments.

### 3. CI/CD Pipeline (Cloud Build & `cloudbuild.yaml`)
Google Cloud Build orchestrates the entire process:
-   **Build**: Cloud Build checks out the code and uses the `Dockerfile` to build the container image.
-   **Store**: The newly built container is tagged and pushed to a secure, private **Artifact Registry**. This provides version control for our deployment artifacts, allowing for easy rollbacks.
-   **Deploy**: Cloud Build then issues a command to deploy the new container image to **Cloud Run**, updating the service to the latest version with zero downtime.

### 4. Scalable Hosting (Cloud Run)
The container is deployed to **Cloud Run**, a serverless platform. This is the ideal hosting solution because:
-   **Auto-scaling**: It automatically scales instances up or down (even to zero) based on traffic.
-   **Managed Infrastructure**: It abstracts away the underlying server management.
-   **Integrated with Google Cloud**: It seamlessly connects with other services like Secret Manager and Firestore.

### 5. Secure Configuration (Secret Manager)
All sensitive information, such as API keys (`.env` variables), is stored in **Google Secret Manager**. The `cloudbuild.yaml` file is configured to securely inject these secrets into the Cloud Run environment at deploy time, preventing them from being hardcoded in the source code.

### 6. Scalable Storage & Learning Loop (Firestore)
-   **Firestore**: The structured data for each case (the diagnosis, report text, and image data URI) is stored in Firestore. The `findCaseExamplesTool` queries this database to provide context for new analyses, creating a continuous learning loop. This internal, expert-curated dataset is a core piece of the application's intellectual property.

This MLOps approach transforms the application from a manually-deployed project into a continuously integrated and deployable system, which is the standard for modern, professional software.

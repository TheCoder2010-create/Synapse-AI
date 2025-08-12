# Synapse AI: Technology Stack & Architecture

Synapse AI is an advanced web application designed to assist radiologists by leveraging generative AI to accelerate the analysis and reporting of medical imaging studies. This document provides a comprehensive overview of the technologies used, from the frontend interface to the automated cloud deployment pipeline.

---

## Technology Stack

The application is built on a modern, robust, and scalable technology stack, centered around TypeScript, Next.js, and Google Cloud.

### **1. Frontend**

The user interface is a dynamic, responsive, and server-first single-page application.

*   **Framework**: **Next.js 15+ (App Router)** - Provides the core structure, including server-side rendering (SSR), Server Components, and a file-based routing system.
*   **UI Library**: **React 18+** - Used for building interactive and stateful user interface components.
*   **Language**: **TypeScript** - Ensures type safety and improves code quality and maintainability.
*   **Component Library**: **ShadCN UI** - A collection of beautifully designed, accessible, and composable components built on Radix UI and Tailwind CSS.
*   **Styling**: **Tailwind CSS** - A utility-first CSS framework for rapid UI development and consistent design.
*   **Animation & Effects**:
    *   **Framer Motion**: Used for fluid animations and transitions within the UI.
    *   **OGL (Minimal WebGL Library)**: Powers the dynamic, generative background visuals on the landing page.

### **2. Backend & AI Orchestration**

The backend logic is tightly integrated within the Next.js framework, leveraging serverless functions and a powerful AI orchestration layer.

*   **Runtime**: **Node.js** - The JavaScript runtime environment for the Next.js server.
*   **Framework**: **Next.js Server Actions** - Used for handling form submissions and client-server communication without the need for traditional REST API endpoints.
*   **Proprietary API Layer**: **Synapse Wrapper API** - A custom-built internal API layer that provides a secure, filtered, and structured interface to external public data sources (TCIA, Radiopaedia, Open-i), forming a core part of the application's intellectual property.
*   **AI Orchestration**: **Google Genkit** - The core of the AI system. It defines, manages, and executes multi-step AI flows, integrates with external tools, and provides observability.
*   **AI Models**: **Google AI Platform (via Gemini)**
    *   `gemini-1.5-pro-latest`: The primary model for complex reasoning, analysis, and tool use.
    *   `gemini-1.5-flash-latest`: A faster, cost-effective fallback model to ensure service resiliency.
    *   `gemini-2.0-flash-preview-image-generation`: Used for the AI-powered image annotation feature.
*   **Database**: **Google Firestore** - A scalable NoSQL database used to store and query past case histories, enabling the AI to learn from expert-verified examples.

### **3. External Services & APIs**

The AI's analysis is grounded in real-world data by connecting to several external, domain-specific knowledge bases via the proprietary **Synapse Wrapper API**.

*   **Radiopaedia API**: For retrieving clinical definitions of radiological terms.
*   **IMAIOS e-Anatomy API**: For looking up detailed anatomical structures.
*   **The Cancer Imaging Archive (TCIA) API**: For finding relevant public imaging datasets for cancer research.
*   **Open-i API (NLM)**: For sourcing visual examples of medical findings from a public image database.

### **4. Deployment & MLOps (DevOps)**

The entire deployment process is automated, ensuring rapid, reliable, and scalable delivery of the application.

*   **Containerization**: **Docker** - The application is packaged into a standardized, portable Docker container using a `Dockerfile`.
*   **CI/CD Pipeline**: **Google Cloud Build** - Orchestrates the entire build, test, and deploy process, triggered automatically by code commits. The pipeline is defined in `cloudbuild.yaml`.
*   **Artifact Storage**: **Google Artifact Registry** - A secure, private registry for storing and versioning the built Docker images.
*   **Secret Management**: **Google Secret Manager** - Securely stores all sensitive API keys and credentials, which are injected into the application at runtime.
*   **Hosting & Scalable Runtime**: **Google Cloud Run** - A fully managed, serverless platform that automatically scales the application based on traffic, providing a highly available and cost-efficient production environment.

---

## Architectural Flow

1.  **Development**: A developer writes code using the stack described above (Next.js, React, Genkit).
2.  **Commit**: Code is pushed to a Git repository (e.g., GitHub).
3.  **CI/CD Trigger**: Google Cloud Build detects the push and starts the pipeline.
4.  **Build & Store**: Cloud Build uses the `Dockerfile` to build a container image and pushes it to Artifact Registry.
5.  **Deploy**: Cloud Build deploys the new image to Cloud Run, pulling secrets from Secret Manager.
6.  **Run**: Cloud Run serves the application globally, auto-scaling instances to meet user demand.

This architecture represents a modern, end-to-end system for building, deploying, and maintaining a production-grade AI web application.

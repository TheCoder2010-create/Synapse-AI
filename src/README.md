# Synapse AI - Local Development Setup

This document provides instructions for setting up and running the Synapse AI application on your local machine for development purposes.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

-   **Node.js**: Version 18.x or later.
-   **npm** or **yarn**: The package manager of your choice.
-   **Google Cloud SDK** (optional but recommended for production deployment management).

## 2. Environment Setup

The application uses environment variables to manage sensitive information like API keys.

1.  **Create an Environment File**:
    In the root of the project, create a new file named `.env`.

2.  **Add API Keys**:
    You will need an API key for Google's Gemini models. Add it to your `.env` file:

    ```bash
    GEMINI_API_KEY="your_google_ai_api_key"
    RADIOPAEDIA_API_KEY="your_radiopaedia_api_key"
    IMAIOS_API_KEY="your_imaios_api_key"
    # Add other keys like XNAT_HOST, XNAT_USER, XNAT_PASS if you are using those services.
    ```

    *Note: The application is designed to gracefully handle missing optional keys (like Radiopaedia, IMAIOS, XNAT) by returning informative messages to the AI flow.*

## 3. Installation

Install the project dependencies using npm:

```bash
npm install
```

This will install all the necessary packages defined in `package.json`, including Next.js, React, Genkit, and ShadCN UI components.

## 4. Running the Application

To run the full application locally, you need to start two processes in separate terminal windows: the Next.js frontend application and the Genkit development UI.

**Terminal 1: Run the Frontend App**

```bash
npm run dev
```

This command starts the Next.js development server, which handles the user interface. The application will be available at [http://localhost:3000](http://localhost:3000).

**Terminal 2: Run the Genkit AI Flows**

```bash
npm run genkit:watch
```

This command starts the Genkit development UI, which allows you to inspect and debug your AI flows. The Genkit UI will be available at [http://localhost:4000](http://localhost:4000). The `--watch` flag will automatically reload the flows when you make changes to the files in the `src/ai/` directory.

## 5. Available Scripts

-   `npm run dev`: Starts the Next.js application in development mode with Turbopack.
-   `npm run build`: Compiles the Next.js application for production.
-   `npm run start`: Starts the production Next.js server.
-   `npm run genkit:dev`: Starts the Genkit development UI.
-   `npm run genkit:watch`: Starts the Genkit development UI in watch mode.
-   `npm run lint`: Runs ESLint to check for code quality issues.
-   `npm run typecheck`: Runs the TypeScript compiler to check for type errors.

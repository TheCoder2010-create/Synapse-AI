# Synapse AI - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying Synapse AI to Google Cloud Platform using Cloud Run, with automated CI/CD pipeline setup and production-ready configurations.

## Prerequisites

### Required Tools
- **Google Cloud SDK** (gcloud CLI)
- **Docker** (for local testing)
- **Node.js** 18.x or later
- **Git** (for version control)

### Google Cloud Setup
1. **Create Google Cloud Project**
   ```bash
   gcloud projects create synapse-ai-prod --name="Synapse AI Production"
   gcloud config set project synapse-ai-prod
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable aiplatform.googleapis.com
   ```

3. **Set Up Billing**
   - Link a billing account to your project
   - Set up budget alerts for cost management

## Environment Configuration

### 1. Secret Management

Create secrets in Google Secret Manager for sensitive configuration:

```bash
# Required API Keys
gcloud secrets create gemini-api-key --data-file=- <<< "your_gemini_api_key"

# Optional API Keys (graceful degradation if missing)
gcloud secrets create radiopaedia-api-key --data-file=- <<< "your_radiopaedia_key"
gcloud secrets create imaios-api-key --data-file=- <<< "your_imaios_key"
gcloud secrets create xnat-host --data-file=- <<< "your_xnat_host"
gcloud secrets create xnat-user --data-file=- <<< "your_xnat_username"
gcloud secrets create xnat-pass --data-file=- <<< "your_xnat_password"
```

### 2. Service Account Setup

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create synapse-ai-service \
    --display-name="Synapse AI Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding synapse-ai-prod \
    --member="serviceAccount:synapse-ai-service@synapse-ai-prod.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding synapse-ai-prod \
    --member="serviceAccount:synapse-ai-service@synapse-ai-prod.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding synapse-ai-prod \
    --member="serviceAccount:synapse-ai-service@synapse-ai-prod.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"
```

## Artifact Registry Setup

### 1. Create Docker Repository

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create synapse-ai-repo \
    --repository-format=docker \
    --location=us-central1 \
    --description="Synapse AI Docker images"

# Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev
```

## Database Setup

### 1. Firestore Configuration

```bash
# Create Firestore database
gcloud firestore databases create --region=us-central1

# Set up Firestore security rules (create firestore.rules file)
gcloud firestore deploy --rules=firestore.rules
```

**firestore.rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Case history collection
    match /cases/{caseId} {
      allow read, write: if request.auth != null;
    }
    
    // User data collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## CI/CD Pipeline Setup

### 1. Cloud Build Configuration

Create `cloudbuild.yaml` in your project root:

```yaml
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/synapse-ai-repo/synapse-ai:$COMMIT_SHA',
      '-t', 'us-central1-docker.pkg.dev/$PROJECT_ID/synapse-ai-repo/synapse-ai:latest',
      '.'
    ]

  # Push the Docker image to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'push',
      'us-central1-docker.pkg.dev/$PROJECT_ID/synapse-ai-repo/synapse-ai:$COMMIT_SHA'
    ]

  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'push',
      'us-central1-docker.pkg.dev/$PROJECT_ID/synapse-ai-repo/synapse-ai:latest'
    ]

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args: [
      'run', 'deploy', 'synapse-ai',
      '--image', 'us-central1-docker.pkg.dev/$PROJECT_ID/synapse-ai-repo/synapse-ai:$COMMIT_SHA',
      '--platform', 'managed',
      '--region', 'us-central1',
      '--service-account', 'synapse-ai-service@$PROJECT_ID.iam.gserviceaccount.com',
      '--set-env-vars', 'NODE_ENV=production',
      '--set-secrets', 'GEMINI_API_KEY=gemini-api-key:latest',
      '--set-secrets', 'RADIOPAEDIA_API_KEY=radiopaedia-api-key:latest',
      '--set-secrets', 'IMAIOS_API_KEY=imaios-api-key:latest',
      '--set-secrets', 'XNAT_HOST=xnat-host:latest',
      '--set-secrets', 'XNAT_USER=xnat-user:latest',
      '--set-secrets', 'XNAT_PASS=xnat-pass:latest',
      '--memory', '2Gi',
      '--cpu', '2',
      '--max-instances', '10',
      '--allow-unauthenticated'
    ]

options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

timeout: '1200s'
```

### 2. Build Trigger Setup

```bash
# Create build trigger for main branch
gcloud builds triggers create github \
    --repo-name=synapse-ai \
    --repo-owner=your-github-username \
    --branch-pattern="^main$" \
    --build-config=cloudbuild.yaml \
    --description="Deploy Synapse AI on main branch push"
```

## Docker Configuration

### 1. Production Dockerfile

Ensure your `Dockerfile` is optimized for production:

```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Optimization

Create `.dockerignore`:
```
node_modules
.next
.git
.gitignore
README.md
Dockerfile
.dockerignore
npm-debug.log
.nyc_output
.coverage
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Cloud Run Configuration

### 1. Service Configuration

```bash
# Deploy with specific configuration
gcloud run deploy synapse-ai \
    --image=us-central1-docker.pkg.dev/synapse-ai-prod/synapse-ai-repo/synapse-ai:latest \
    --platform=managed \
    --region=us-central1 \
    --service-account=synapse-ai-service@synapse-ai-prod.iam.gserviceaccount.com \
    --memory=2Gi \
    --cpu=2 \
    --max-instances=10 \
    --min-instances=1 \
    --concurrency=80 \
    --timeout=300 \
    --allow-unauthenticated
```

### 2. Environment Variables

Set environment variables through Cloud Run:

```bash
# Set production environment
gcloud run services update synapse-ai \
    --region=us-central1 \
    --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1"

# Set secrets as environment variables
gcloud run services update synapse-ai \
    --region=us-central1 \
    --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,RADIOPAEDIA_API_KEY=radiopaedia-api-key:latest"
```

## Custom Domain Setup

### 1. Domain Mapping

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
    --service=synapse-ai \
    --domain=app.synapseai.com \
    --region=us-central1
```

### 2. SSL Certificate

```bash
# Create managed SSL certificate
gcloud compute ssl-certificates create synapse-ai-ssl \
    --domains=app.synapseai.com \
    --global
```

## Monitoring and Logging

### 1. Cloud Monitoring Setup

```bash
# Create uptime check
gcloud alpha monitoring uptime create \
    --display-name="Synapse AI Uptime Check" \
    --http-check-path="/" \
    --hostname="app.synapseai.com" \
    --port=443 \
    --use-ssl
```

### 2. Alerting Policies

Create alerting policies for:
- **Service Availability**: Uptime monitoring
- **Error Rate**: HTTP 5xx errors
- **Response Time**: Latency monitoring
- **Resource Usage**: CPU and memory utilization

### 3. Log-based Metrics

```bash
# Create log-based metric for AI processing time
gcloud logging metrics create ai_processing_time \
    --description="AI processing time metric" \
    --log-filter='resource.type="cloud_run_revision" AND jsonPayload.message="AI processing completed"'
```

## Security Configuration

### 1. IAM Policies

```bash
# Restrict access to production resources
gcloud projects add-iam-policy-binding synapse-ai-prod \
    --member="group:synapse-ai-admins@company.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding synapse-ai-prod \
    --member="group:synapse-ai-developers@company.com" \
    --role="roles/run.developer"
```

### 2. VPC Configuration (Optional)

For enhanced security, deploy to VPC:

```bash
# Create VPC
gcloud compute networks create synapse-ai-vpc --subnet-mode=custom

# Create subnet
gcloud compute networks subnets create synapse-ai-subnet \
    --network=synapse-ai-vpc \
    --range=10.0.0.0/24 \
    --region=us-central1

# Deploy Cloud Run with VPC connector
gcloud run deploy synapse-ai \
    --vpc-connector=synapse-ai-connector \
    --vpc-egress=private-ranges-only
```

## Performance Optimization

### 1. Cloud CDN Setup

```bash
# Create load balancer with CDN
gcloud compute backend-services create synapse-ai-backend \
    --global \
    --enable-cdn

# Configure CDN caching
gcloud compute backend-services update synapse-ai-backend \
    --global \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600
```

### 2. Auto-scaling Configuration

```yaml
# Cloud Run auto-scaling settings
metadata:
  annotations:
    autoscaling.knative.dev/minScale: "1"
    autoscaling.knative.dev/maxScale: "10"
    run.googleapis.com/cpu-throttling: "false"
spec:
  containerConcurrency: 80
  timeoutSeconds: 300
```

## Backup and Disaster Recovery

### 1. Database Backup

```bash
# Set up automated Firestore backups
gcloud firestore operations list
gcloud alpha firestore export gs://synapse-ai-backups/$(date +%Y%m%d)
```

### 2. Container Image Backup

```bash
# Create backup repository
gcloud artifacts repositories create synapse-ai-backup \
    --repository-format=docker \
    --location=us-east1

# Copy images to backup region
gcloud container images add-tag \
    us-central1-docker.pkg.dev/synapse-ai-prod/synapse-ai-repo/synapse-ai:latest \
    us-east1-docker.pkg.dev/synapse-ai-prod/synapse-ai-backup/synapse-ai:latest
```

## Health Checks and Monitoring

### 1. Application Health Endpoint

Add health check endpoint to your Next.js app:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### 2. Readiness and Liveness Probes

```yaml
# Cloud Run health check configuration
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
    spec:
      containers:
      - image: us-central1-docker.pkg.dev/synapse-ai-prod/synapse-ai-repo/synapse-ai
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   
   # Test build locally
   docker build -t synapse-ai-test .
   docker run -p 3000:3000 synapse-ai-test
   ```

2. **Service Startup Issues**
   ```bash
   # Check Cloud Run logs
   gcloud logs read --service=synapse-ai --region=us-central1
   
   # Check service status
   gcloud run services describe synapse-ai --region=us-central1
   ```

3. **Secret Access Issues**
   ```bash
   # Verify secret permissions
   gcloud secrets get-iam-policy gemini-api-key
   
   # Test secret access
   gcloud secrets versions access latest --secret=gemini-api-key
   ```

### Performance Troubleshooting

1. **High Latency**
   - Check Cloud Run cold starts
   - Verify minimum instances setting
   - Review database query performance

2. **Memory Issues**
   - Monitor memory usage in Cloud Monitoring
   - Increase memory allocation if needed
   - Check for memory leaks in application

3. **Rate Limiting**
   - Monitor API usage quotas
   - Implement request caching
   - Add retry logic with exponential backoff

## Maintenance

### 1. Regular Updates

```bash
# Update dependencies
npm audit fix
npm update

# Rebuild and deploy
gcloud builds submit --config=cloudbuild.yaml
```

### 2. Security Updates

```bash
# Update base Docker image
docker pull node:18-alpine

# Scan for vulnerabilities
gcloud container images scan IMAGE_URL
```

### 3. Cost Optimization

- Monitor Cloud Billing reports
- Set up budget alerts
- Review resource utilization
- Optimize auto-scaling settings

---

This deployment guide provides a comprehensive approach to deploying Synapse AI in a production-ready environment with proper security, monitoring, and scalability considerations.
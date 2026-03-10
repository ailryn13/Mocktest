# GCP Deployment Guide for Mocktest Exam Portal

## Prerequisites

1. **GCP Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally
4. Required GCP APIs enabled:
   - Compute Engine API
   - Cloud SQL Admin API
   - Cloud Storage API
   - Container Registry API
   - Cloud Run API (if using Cloud Run)

## Quick Start

### 1. Configure GCP Project

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Set region
gcloud config set compute/region asia-south1
gcloud config set compute/zone asia-south1-a
```

### 2. Set Up Cloud SQL (PostgreSQL)

```bash
# Create Cloud SQL instance
gcloud sql instances create exam-portal-db \
    --database-version=POSTGRES_14 \
    --tier=db-custom-2-4096 \
    --region=asia-south1

# Set root password
gcloud sql users set-password postgres \
    --instance=exam-portal-db \
    --password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create exam_portal_db --instance=exam-portal-db
```

### 3. Set Up Cloud Memorystore (Redis)

```bash
gcloud redis instances create exam-portal-redis \
    --size=1 \
    --region=asia-south1 \
    --redis-version=redis_6_x
```

### 4. Set Up Cloud Storage Bucket

```bash
# Create bucket for file storage
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l asia-south1 gs://exam-portal-storage

# Set public access if needed
gsutil iam ch allUsers:objectViewer gs://exam-portal-storage
```

### 5. Configure Environment Variables

Update `.env.gcp` with your actual values:

```bash
cp .env.gcp .env.gcp.local
# Edit .env.gcp.local with your values
```

### 6. Build and Push Images

```bash
# Authenticate Docker with GCR
gcloud auth configure-docker

# Build and push
./scripts/build-and-push-gcp.ps1
```

### 7. Deploy Application

#### Option A: Cloud Run (Serverless - Recommended for Auto-scaling)

```bash
# Deploy backend
gcloud run deploy exam-backend \
    --image gcr.io/YOUR_PROJECT_ID/exam-portal-backend:latest \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated \
    --set-cloudsql-instances YOUR_PROJECT_ID:asia-south1:exam-portal-db \
    --env-vars-file .env.gcp.local

# Deploy frontend
gcloud run deploy exam-frontend \
    --image gcr.io/YOUR_PROJECT_ID/exam-portal-frontend:latest \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated
```

#### Option B: Compute Engine (VM-based)

```bash
# Create VM instance
gcloud compute instances create exam-portal-vm \
    --machine-type=e2-standard-4 \
    --zone=asia-south1-a \
    --image-family=cos-stable \
    --image-project=cos-cloud \
    --boot-disk-size=50GB

# SSH into instance
gcloud compute ssh exam-portal-vm --zone=asia-south1-a

# On the VM:
docker-compose -f docker-compose.gcp.yml up -d
```

## Cost Estimates

### Small Deployment (100-500 concurrent users)
- Cloud SQL (db-custom-1-3840): ~$50/month
- Memorystore Redis (1GB): ~$35/month
- Cloud Run (Backend + Frontend): ~$30-50/month
- Cloud Storage: ~$5/month
- **Total: ~$120-140/month**

### Medium Deployment (500-2000 concurrent users)
- Cloud SQL (db-custom-2-8192): ~$120/month
- Memorystore Redis (5GB): ~$170/month
- Cloud Run or Compute Engine (e2-standard-4): ~$80/month
- Cloud Storage: ~$10/month
- **Total: ~$380/month**

## Monitoring

### Enable Cloud Monitoring

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# View metrics
gcloud monitoring dashboards list
```

## Backup Strategy

### Automated Cloud SQL Backups

```bash
# Enable automatic backups
gcloud sql instances patch exam-portal-db \
    --backup-start-time=03:00

# Create manual backup
gcloud sql backups create --instance=exam-portal-db
```

### Storage Backup

```bash
# Enable versioning
gsutil versioning set on gs://exam-portal-storage
```

## Security Best Practices

1. **Use Secret Manager** for sensitive credentials
2. **Enable VPC** for private networking
3. **Use Cloud Armor** for DDoS protection
4. **Enable SSL/TLS** for all endpoints
5. **Regular security scans** with Cloud Security Scanner

## Troubleshooting

### Check Service Status

```bash
# Cloud Run
gcloud run services list

# Compute Engine
gcloud compute instances list

# Cloud SQL
gcloud sql instances list
```

### View Logs

```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-backend" --limit 50

# Compute Engine logs
gcloud compute ssh exam-portal-vm --command="docker-compose logs -f"
```

## Scaling

### Cloud Run Auto-scaling

Cloud Run automatically scales based on traffic. Configure limits:

```bash
gcloud run services update exam-backend \
    --max-instances=10 \
    --min-instances=1
```

### Compute Engine Manual Scaling

```bash
# Resize VM
gcloud compute instances set-machine-type exam-portal-vm \
    --machine-type e2-standard-8 \
    --zone asia-south1-a
```

## Migration from AWS

If migrating from AWS:

1. **Export AWS RDS** database and import to Cloud SQL
2. **Transfer S3 files** to Cloud Storage:
   ```bash
   gsutil -m cp -r s3://your-aws-bucket gs://your-gcp-bucket
   ```
3. **Update application configs** to use GCP services
4. **Test thoroughly** before switching DNS

## Support

For issues or questions:
- GCP Console: https://console.cloud.google.com
- GCP Documentation: https://cloud.google.com/docs
- Project Issues: https://github.com/ailryn13/Mocktest/issues

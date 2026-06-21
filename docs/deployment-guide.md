# D-CloudX Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying D-CloudX in various environments, from local development to production Kubernetes clusters.

## Prerequisites

### System Requirements

- **CPU**: Minimum 4 cores, recommended 8+ cores
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: Minimum 100GB SSD, recommended 500GB+
- **Network**: Stable internet connection for blockchain and cloud provider access

### Software Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 18+
- **npm**: Version 8+
- **Git**: Latest version
- **kubectl**: Version 1.24+ (for Kubernetes deployment)
- **helm**: Version 3.8+ (for Kubernetes deployment)

### Cloud Provider Accounts

- **AWS**: EC2, S3, CloudWatch access
- **Azure**: Virtual Machines, Blob Storage, Monitor access
- **GCP**: Compute Engine, Cloud Storage, Monitoring access

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/dcloudx/dcloudx.git
cd dcloudx
```

### 2. Run Setup Script

```bash
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh
```

### 3. Start Development Services

```bash
# Start all services with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Or start individual services
docker-compose -f docker/docker-compose.yml up -d mongodb redis
```

### 4. Deploy Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy:sepolia  # Deploy to Sepolia testnet
```

### 5. Start Backend API

```bash
cd server
npm install
npm run start:dev
```

### 6. Start Frontend

```bash
cd client
npm install
npm run dev
```

### 7. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## Docker Deployment

### 1. Build Images

```bash
# Build all images
docker-compose -f docker/docker-compose.yml build

# Or build individual images
docker build -f docker/Dockerfile.client -t dcloudx-client:latest ./client
docker build -f docker/Dockerfile.server -t dcloudx-server:latest ./server
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Start Services

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Check service status
docker-compose -f docker/docker-compose.yml ps

# View logs
docker-compose -f docker/docker-compose.yml logs -f
```

### 4. Health Checks

```bash
# Check API health
curl http://localhost:5000/api/v1/health

# Check frontend health
curl http://localhost:3000/api/health

# Check database connection
docker-compose -f docker/docker-compose.yml exec mongodb mongosh --eval "db.runCommand('ping')"
```

## Kubernetes Deployment

### 1. Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 2. Create Cluster

```bash
# Using minikube (for local testing)
minikube start --cpus=4 --memory=8192

# Using kind (for local testing)
kind create cluster --config=kind-config.yaml

# Using cloud provider (AWS EKS, Azure AKS, GCP GKE)
# Follow cloud provider specific instructions
```

### 3. Deploy Infrastructure

```bash
# Create namespace and basic resources
kubectl apply -f k8s/namespace-configmap-secrets.yaml

# Deploy databases
kubectl apply -f k8s/database-services.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n dcloudx --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n dcloudx --timeout=300s
```

### 4. Deploy Applications

```bash
# Deploy backend and frontend
kubectl apply -f k8s/applications.yaml

# Deploy monitoring stack
kubectl apply -f k8s/monitoring.yaml

# Deploy ingress and networking
kubectl apply -f k8s/ingress-networking.yaml
```

### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n dcloudx

# Check services
kubectl get services -n dcloudx

# Check ingress
kubectl get ingress -n dcloudx

# Port forward for testing
kubectl port-forward service/dcloudx-server-service 5000:5000 -n dcloudx
kubectl port-forward service/dcloudx-client-service 3000:3000 -n dcloudx
```

## Production Deployment

### 1. Infrastructure Setup

#### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster --name dcloudx-prod --region us-west-2 --nodegroup-name workers --node-type t3.medium --nodes 3

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name dcloudx-prod
```

#### Azure AKS

```bash
# Create AKS cluster
az aks create --resource-group dcloudx-rg --name dcloudx-prod --node-count 3 --enable-addons monitoring --generate-ssh-keys

# Configure kubectl
az aks get-credentials --resource-group dcloudx-rg --name dcloudx-prod
```

#### GCP GKE

```bash
# Create GKE cluster
gcloud container clusters create dcloudx-prod --zone us-central1-a --num-nodes 3 --machine-type e2-medium

# Configure kubectl
gcloud container clusters get-credentials dcloudx-prod --zone us-central1-a
```

### 2. Configure Secrets

```bash
# Create secrets for production
kubectl create secret generic dcloudx-secrets \
  --from-literal=MONGODB_PASSWORD=your-secure-password \
  --from-literal=REDIS_PASSWORD=your-redis-password \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=BLOCKCHAIN_PRIVATE_KEY=your-private-key \
  -n dcloudx

# Create cloud provider secrets
kubectl create secret generic aws-credentials \
  --from-literal=AWS_ACCESS_KEY_ID=your-access-key \
  --from-literal=AWS_SECRET_ACCESS_KEY=your-secret-key \
  -n dcloudx

kubectl create secret generic azure-credentials \
  --from-literal=AZURE_CLIENT_ID=your-client-id \
  --from-literal=AZURE_CLIENT_SECRET=your-client-secret \
  --from-literal=AZURE_TENANT_ID=your-tenant-id \
  -n dcloudx

kubectl create secret generic gcp-credentials \
  --from-file=gcp-key.json=path/to/gcp-key.json \
  -n dcloudx
```

### 3. Deploy with Helm

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add elastic https://helm.elastic.co
helm repo update

# Install monitoring stack
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
helm install kibana elastic/kibana -n logging
helm install logstash elastic/logstash -n logging

# Deploy D-CloudX
helm install dcloudx ./helm/dcloudx -n dcloudx --create-namespace
```

### 4. Configure Load Balancer

```bash
# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Get external IP
kubectl get service ingress-nginx-controller -n ingress-nginx
```

### 5. SSL Certificate

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create certificate issuer
kubectl apply -f k8s/certificate-issuer.yaml

# Update ingress with SSL
kubectl apply -f k8s/ingress-ssl.yaml
```

## CI/CD Pipeline

### 1. GitHub Actions Setup

```bash
# Create GitHub repository secrets
# Go to Settings > Secrets and variables > Actions
# Add the following secrets:
# - KUBE_CONFIG_PRODUCTION
# - KUBE_CONFIG_STAGING
# - DOCKER_REGISTRY_TOKEN
# - SLACK_WEBHOOK
```

### 2. Configure Workflows

The CI/CD pipeline is automatically configured with the following workflows:

- **Pull Request**: Runs tests and security scans
- **Push to develop**: Deploys to staging environment
- **Push to main**: Deploys to production environment
- **Release**: Creates and deploys release versions

### 3. Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh develop staging

# Deploy to production
./scripts/deploy.sh main production
```

## Monitoring and Logging

### 1. Prometheus Metrics

```bash
# Access Prometheus
kubectl port-forward service/prometheus-service 9090:9090 -n dcloudx

# View metrics
curl http://localhost:9090/api/v1/query?query=up
```

### 2. Grafana Dashboards

```bash
# Access Grafana
kubectl port-forward service/grafana-service 3000:3000 -n dcloudx

# Default credentials: admin/admin123
# Change password on first login
```

### 3. ELK Stack

```bash
# Access Kibana
kubectl port-forward service/kibana-service 5601:5601 -n dcloudx

# View logs
curl http://localhost:5601/api/status
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check MongoDB status
kubectl logs -l app=mongodb -n dcloudx

# Check connection string
kubectl get configmap dcloudx-config -n dcloudx -o yaml
```

#### 2. Blockchain Connection Issues

```bash
# Check blockchain service logs
kubectl logs -l app=dcloudx-server -n dcloudx | grep blockchain

# Verify RPC endpoint
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://sepolia.infura.io/v3/your-infura-key
```

#### 3. Cloud Provider Issues

```bash
# Check cloud provider service logs
kubectl logs -l app=dcloudx-server -n dcloudx | grep cloud

# Verify credentials
kubectl get secret aws-credentials -n dcloudx -o yaml
```

### Debug Commands

```bash
# Get pod logs
kubectl logs -f deployment/dcloudx-server -n dcloudx

# Execute commands in pod
kubectl exec -it deployment/dcloudx-server -n dcloudx -- /bin/bash

# Describe pod for events
kubectl describe pod -l app=dcloudx-server -n dcloudx

# Check resource usage
kubectl top pods -n dcloudx
```

## Security Considerations

### 1. Network Security

- Use network policies to restrict pod-to-pod communication
- Enable TLS/SSL for all external communications
- Use private subnets for database and internal services

### 2. Access Control

- Implement RBAC for Kubernetes resources
- Use least privilege principle for service accounts
- Regularly rotate secrets and certificates

### 3. Data Protection

- Encrypt data at rest and in transit
- Use secure key management systems
- Implement data backup and recovery procedures

## Backup and Recovery

### 1. Database Backup

```bash
# Create MongoDB backup
kubectl exec -it deployment/mongodb -n dcloudx -- mongodump --out /backup/$(date +%Y%m%d)

# Restore from backup
kubectl exec -it deployment/mongodb -n dcloudx -- mongorestore /backup/20240101
```

### 2. Configuration Backup

```bash
# Backup Kubernetes resources
kubectl get all -n dcloudx -o yaml > dcloudx-backup.yaml

# Restore from backup
kubectl apply -f dcloudx-backup.yaml
```

### 3. Disaster Recovery

- Implement automated backup procedures
- Test recovery procedures regularly
- Maintain disaster recovery documentation
- Use multi-region deployment for high availability

## Performance Optimization

### 1. Resource Optimization

```bash
# Set resource limits and requests
kubectl patch deployment dcloudx-server -n dcloudx -p '{"spec":{"template":{"spec":{"containers":[{"name":"dcloudx-server","resources":{"limits":{"cpu":"500m","memory":"1Gi"},"requests":{"cpu":"250m","memory":"512Mi"}}}]}}}}'
```

### 2. Horizontal Scaling

```bash
# Scale deployments
kubectl scale deployment dcloudx-server --replicas=5 -n dcloudx
kubectl scale deployment dcloudx-client --replicas=3 -n dcloudx
```

### 3. Caching

```bash
# Enable Redis caching
kubectl patch deployment dcloudx-server -n dcloudx -p '{"spec":{"template":{"spec":{"containers":[{"name":"dcloudx-server","env":[{"name":"REDIS_ENABLED","value":"true"}]}]}}}}'
```

## Maintenance

### 1. Regular Updates

```bash
# Update images
kubectl set image deployment/dcloudx-server dcloudx-server=dcloudx-server:latest -n dcloudx

# Rolling update
kubectl rollout restart deployment/dcloudx-server -n dcloudx
```

### 2. Health Checks

```bash
# Check deployment status
kubectl rollout status deployment/dcloudx-server -n dcloudx

# Check pod health
kubectl get pods -n dcloudx -o wide
```

### 3. Log Rotation

```bash
# Configure log rotation
kubectl patch deployment/dcloudx-server -n dcloudx -p '{"spec":{"template":{"spec":{"containers":[{"name":"dcloudx-server","volumeMounts":[{"name":"logs","mountPath":"/var/log"}]}]}}}}'
```

## Support

For deployment support and questions:

- **Documentation**: [https://docs.dcloudx.com](https://docs.dcloudx.com)
- **GitHub Issues**: [https://github.com/dcloudx/dcloudx/issues](https://github.com/dcloudx/dcloudx/issues)
- **Discord**: [https://discord.gg/dcloudx](https://discord.gg/dcloudx)
- **Email**: support@dcloudx.com

#!/bin/bash

# D-CloudX Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="dcloudx"
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"development"}

echo -e "${BLUE}🚀 Starting D-CloudX deployment...${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}❌ docker is not installed${NC}"
    exit 1
fi

if ! command_exists helm; then
    echo -e "${RED}❌ helm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Create namespace if it doesn't exist
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Build and push Docker images
echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"

# Build client image
echo -e "${BLUE}Building client image...${NC}"
docker build -f docker/Dockerfile.client -t ${DOCKER_REGISTRY}/dcloudx-client:${VERSION} ./client
docker push ${DOCKER_REGISTRY}/dcloudx-client:${VERSION}

# Build server image
echo -e "${BLUE}Building server image...${NC}"
docker build -f docker/Dockerfile.server -t ${DOCKER_REGISTRY}/dcloudx-server:${VERSION} ./server
docker push ${DOCKER_REGISTRY}/dcloudx-server:${VERSION}

# Deploy infrastructure components
echo -e "${YELLOW}🏗️ Deploying infrastructure components...${NC}"

# Deploy namespace, configmaps, and secrets
kubectl apply -f k8s/namespace-configmap-secrets.yaml

# Deploy database services
kubectl apply -f k8s/database-services.yaml

# Wait for databases to be ready
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=mongodb -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s

# Deploy applications
echo -e "${YELLOW}🚀 Deploying applications...${NC}"
kubectl apply -f k8s/applications.yaml

# Deploy monitoring
echo -e "${YELLOW}📊 Deploying monitoring stack...${NC}"
kubectl apply -f k8s/monitoring.yaml

# Deploy ingress and networking
echo -e "${YELLOW}🌐 Deploying ingress and networking...${NC}"
kubectl apply -f k8s/ingress-networking.yaml

# Wait for applications to be ready
echo -e "${YELLOW}⏳ Waiting for applications to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=dcloudx-server -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=dcloudx-client -n ${NAMESPACE} --timeout=300s

# Deploy smart contracts (if in development)
if [ "${ENVIRONMENT}" = "development" ]; then
    echo -e "${YELLOW}📜 Deploying smart contracts...${NC}"
    kubectl apply -f k8s/contracts.yaml
fi

# Run health checks
echo -e "${YELLOW}🏥 Running health checks...${NC}"

# Check if services are responding
CLIENT_URL=$(kubectl get ingress dcloudx-ingress -n ${NAMESPACE} -o jsonpath='{.spec.rules[0].host}')
if [ -n "${CLIENT_URL}" ]; then
    echo -e "${BLUE}Testing client health...${NC}"
    curl -f http://${CLIENT_URL}/api/health || echo -e "${RED}❌ Client health check failed${NC}"
fi

# Show deployment status
echo -e "${YELLOW}📊 Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}
kubectl get ingress -n ${NAMESPACE}

# Show access information
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📱 Access URLs:${NC}"
echo -e "${GREEN}  Frontend: http://${CLIENT_URL}${NC}"
echo -e "${GREEN}  API Docs: http://${CLIENT_URL}/docs${NC}"
echo -e "${GREEN}  Grafana: http://${CLIENT_URL}/grafana${NC}"
echo -e "${GREEN}  Prometheus: http://${CLIENT_URL}/prometheus${NC}"
echo -e "${GREEN}  Kibana: http://${CLIENT_URL}/kibana${NC}"

echo -e "${BLUE}🔧 Useful commands:${NC}"
echo -e "${BLUE}  View logs: kubectl logs -f deployment/dcloudx-server -n ${NAMESPACE}${NC}"
echo -e "${BLUE}  Scale server: kubectl scale deployment dcloudx-server --replicas=5 -n ${NAMESPACE}${NC}"
echo -e "${BLUE}  Port forward: kubectl port-forward service/dcloudx-server-service 5000:5000 -n ${NAMESPACE}${NC}"

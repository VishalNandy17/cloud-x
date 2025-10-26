#!/bin/bash

# D-CloudX Complete Project Test Script
# This script tests all components of the D-CloudX project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "Running test: $test_name"
    
    if eval "$test_command"; then
        success "✅ $test_name - PASSED"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        error "❌ $test_name - FAILED"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test Node.js and npm
test_prerequisites() {
    log "Testing prerequisites..."
    
    run_test "Node.js version check" "node --version | grep -E 'v(18|20)'"
    run_test "npm version check" "npm --version"
}

# Test contracts
test_contracts() {
    log "Testing smart contracts..."
    
    cd contracts
    
    # Install dependencies
    run_test "Contract dependencies installation" "npm install --legacy-peer-deps"
    
    # Compile contracts
    run_test "Contract compilation" "npm run compile"
    
    # Run tests
    run_test "Contract tests" "npm run test"
    
    cd ..
}

# Test server
test_server() {
    log "Testing server (NestJS backend)..."
    
    cd server
    
    # Install dependencies
    run_test "Server dependencies installation" "npm install"
    
    # Run tests
    run_test "Server tests" "npm run test"
    
    # Build server
    run_test "Server build" "npm run build"
    
    cd ..
}

# Test client
test_client() {
    log "Testing client (Next.js frontend)..."
    
    cd client
    
    # Install dependencies
    run_test "Client dependencies installation" "npm install"
    
    # Run tests
    run_test "Client tests" "npm run test"
    
    # Build client
    run_test "Client build" "npm run build"
    
    cd ..
}

# Test Docker
test_docker() {
    log "Testing Docker configurations..."
    
    # Check if Docker is available
    run_test "Docker availability" "docker --version"
    
    # Test Docker Compose file
    run_test "Docker Compose validation" "docker-compose -f docker/docker-compose.yml config"
    
    # Test Dockerfiles
    run_test "Client Dockerfile validation" "docker build -f docker/Dockerfile.client -t test-client . --dry-run"
    run_test "Server Dockerfile validation" "docker build -f docker/Dockerfile.server -t test-server . --dry-run"
}

# Test Kubernetes manifests
test_kubernetes() {
    log "Testing Kubernetes manifests..."
    
    # Check if kubectl is available
    run_test "kubectl availability" "kubectl version --client"
    
    # Validate Kubernetes manifests
    run_test "Namespace manifest validation" "kubectl apply -f k8s/namespace-configmap-secrets.yaml --dry-run=client"
    run_test "Database services validation" "kubectl apply -f k8s/database-services.yaml --dry-run=client"
    run_test "Applications validation" "kubectl apply -f k8s/applications.yaml --dry-run=client"
    run_test "Monitoring validation" "kubectl apply -f k8s/monitoring.yaml --dry-run=client"
    run_test "Ingress validation" "kubectl apply -f k8s/ingress-networking.yaml --dry-run=client"
}

# Test scripts
test_scripts() {
    log "Testing deployment and setup scripts..."
    
    # Check script permissions and syntax
    run_test "Deploy script syntax" "bash -n scripts/deploy.sh"
    run_test "Setup script syntax" "bash -n scripts/setup-dev.sh"
    run_test "Troubleshoot script syntax" "bash -n scripts/troubleshoot.sh"
}

# Test documentation
test_documentation() {
    log "Testing documentation..."
    
    # Check if documentation files exist
    run_test "README exists" "test -f readme.md"
    run_test "API documentation exists" "test -f docs/api-documentation.md"
    run_test "Architecture documentation exists" "test -f docs/architecture.md"
    run_test "Deployment guide exists" "test -f docs/deployment-guide.md"
    run_test "Troubleshooting guide exists" "test -f docs/troubleshooting-guide.md"
}

# Test CI/CD
test_cicd() {
    log "Testing CI/CD configuration..."
    
    # Check GitHub Actions workflow
    run_test "CI/CD workflow exists" "test -f .github/workflows/ci-cd.yml"
    
    # Validate workflow syntax
    run_test "CI/CD workflow syntax" "python -c 'import yaml; yaml.safe_load(open(\".github/workflows/ci-cd.yml\"))'"
}

# Test file structure
test_file_structure() {
    log "Testing project file structure..."
    
    # Check main directories
    run_test "Contracts directory exists" "test -d contracts"
    run_test "Server directory exists" "test -d server"
    run_test "Client directory exists" "test -d client"
    run_test "Docker directory exists" "test -d docker"
    run_test "K8s directory exists" "test -d k8s"
    run_test "Scripts directory exists" "test -d scripts"
    run_test "Docs directory exists" "test -d docs"
    
    # Check key files
    run_test "Package.json files exist" "test -f contracts/package.json && test -f server/package.json && test -f client/package.json"
    run_test "Docker Compose file exists" "test -f docker/docker-compose.yml"
    run_test "Hardhat config exists" "test -f contracts/hardhat.config.js"
}

# Run security checks
test_security() {
    log "Running security checks..."
    
    # Check for common security issues
    run_test "No hardcoded secrets in code" "! grep -r 'password\\|secret\\|key' --include='*.js' --include='*.ts' --include='*.sol' . | grep -v node_modules | grep -v '.git' | grep -v 'test'"
    
    # Check package.json for known vulnerabilities
    run_test "Contract security audit" "cd contracts && npm audit --audit-level moderate || true"
    run_test "Server security audit" "cd server && npm audit --audit-level moderate || true"
    run_test "Client security audit" "cd client && npm audit --audit-level moderate || true"
}

# Generate test report
generate_report() {
    log "Generating test report..."
    
    echo ""
    echo "=========================================="
    echo "           D-CloudX Test Report"
    echo "=========================================="
    echo ""
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        success "🎉 All tests passed! Project is ready for deployment."
        echo ""
        echo "Next steps:"
        echo "1. Deploy to staging environment"
        echo "2. Run integration tests"
        echo "3. Deploy to production"
        echo "4. Monitor application performance"
    else
        error "❌ Some tests failed. Please review and fix the issues."
        echo ""
        echo "Failed tests need to be addressed before deployment."
    fi
    
    echo ""
    echo "Test completed at: $(date)"
    echo "=========================================="
}

# Main test function
main() {
    log "Starting D-CloudX Complete Project Test Suite..."
    echo ""
    
    # Run all test suites
    test_prerequisites
    test_file_structure
    test_contracts
    test_server
    test_client
    test_docker
    test_kubernetes
    test_scripts
    test_documentation
    test_cicd
    test_security
    
    # Generate final report
    generate_report
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Handle script interruption
trap 'echo ""; error "Test interrupted by user"; exit 1' INT

# Run main function
main "$@"

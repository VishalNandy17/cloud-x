#!/bin/bash

# D-CloudX CI/CD Troubleshooting Script
# This script helps diagnose and fix common CI/CD pipeline issues

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

# Check Node.js version
check_node_version() {
    log "Checking Node.js version..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        return 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18+ is required. Current version: $(node --version)"
        return 1
    fi
    
    success "Node.js version check passed: $(node --version)"
    return 0
}

# Check npm version
check_npm_version() {
    log "Checking npm version..."
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        return 1
    fi
    
    success "npm version check passed: $(npm --version)"
    return 0
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Install contract dependencies
    log "Installing contract dependencies..."
    cd contracts
    if npm ci; then
        success "Contract dependencies installed successfully"
    else
        error "Failed to install contract dependencies"
        return 1
    fi
    cd ..
    
    # Install server dependencies
    log "Installing server dependencies..."
    cd server
    if npm ci; then
        success "Server dependencies installed successfully"
    else
        error "Failed to install server dependencies"
        return 1
    fi
    cd ..
    
    # Install client dependencies
    log "Installing client dependencies..."
    cd client
    if npm ci; then
        success "Client dependencies installed successfully"
    else
        error "Failed to install client dependencies"
        return 1
    fi
    cd ..
    
    return 0
}

# Run contract tests
test_contracts() {
    log "Running contract tests..."
    
    cd contracts
    
    # Compile contracts first
    log "Compiling contracts..."
    if npm run compile; then
        success "Contracts compiled successfully"
    else
        error "Failed to compile contracts"
        return 1
    fi
    
    # Run tests
    log "Running contract tests..."
    if npm run test; then
        success "Contract tests passed"
    else
        error "Contract tests failed"
        return 1
    fi
    
    cd ..
    return 0
}

# Run server tests
test_server() {
    log "Running server tests..."
    
    cd server
    
    # Run tests
    if npm run test; then
        success "Server tests passed"
    else
        error "Server tests failed"
        return 1
    fi
    
    cd ..
    return 0
}

# Run client tests
test_client() {
    log "Running client tests..."
    
    cd client
    
    # Run tests
    if npm run test; then
        success "Client tests passed"
    else
        error "Client tests failed"
        return 1
    fi
    
    cd ..
    return 0
}

# Run linting
run_linting() {
    log "Running linting..."
    
    # Contract linting
    log "Running contract linting..."
    cd contracts
    if npm run lint; then
        success "Contract linting passed"
    else
        warning "Contract linting completed with warnings"
    fi
    cd ..
    
    # Server linting
    log "Running server linting..."
    cd server
    if npm run lint; then
        success "Server linting passed"
    else
        warning "Server linting completed with warnings"
    fi
    cd ..
    
    # Client linting
    log "Running client linting..."
    cd client
    if npm run lint; then
        success "Client linting passed"
    else
        warning "Client linting completed with warnings"
    fi
    cd ..
    
    return 0
}

# Run security audit
run_security_audit() {
    log "Running security audit..."
    
    # Contract audit
    log "Running contract security audit..."
    cd contracts
    if npm audit --audit-level moderate; then
        success "Contract security audit passed"
    else
        warning "Contract security audit completed with warnings"
    fi
    cd ..
    
    # Server audit
    log "Running server security audit..."
    cd server
    if npm audit --audit-level moderate; then
        success "Server security audit passed"
    else
        warning "Server security audit completed with warnings"
    fi
    cd ..
    
    # Client audit
    log "Running client security audit..."
    cd client
    if npm audit --audit-level moderate; then
        success "Client security audit passed"
    else
        warning "Client security audit completed with warnings"
    fi
    cd ..
    
    return 0
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build contracts
    log "Building contracts..."
    cd contracts
    if npm run compile; then
        success "Contracts built successfully"
    else
        error "Failed to build contracts"
        return 1
    fi
    cd ..
    
    # Build server
    log "Building server..."
    cd server
    if npm run build; then
        success "Server built successfully"
    else
        error "Failed to build server"
        return 1
    fi
    cd ..
    
    # Build client
    log "Building client..."
    cd client
    if npm run build; then
        success "Client built successfully"
    else
        error "Failed to build client"
        return 1
    fi
    cd ..
    
    return 0
}

# Main troubleshooting function
troubleshoot() {
    log "Starting D-CloudX CI/CD troubleshooting..."
    
    local exit_code=0
    
    # Check prerequisites
    if ! check_node_version; then
        exit_code=1
    fi
    
    if ! check_npm_version; then
        exit_code=1
    fi
    
    if [ $exit_code -ne 0 ]; then
        error "Prerequisites check failed. Please fix the issues above."
        return $exit_code
    fi
    
    # Install dependencies
    if ! install_dependencies; then
        error "Dependency installation failed"
        return 1
    fi
    
    # Run tests
    if ! test_contracts; then
        error "Contract tests failed"
        exit_code=1
    fi
    
    if ! test_server; then
        error "Server tests failed"
        exit_code=1
    fi
    
    if ! test_client; then
        error "Client tests failed"
        exit_code=1
    fi
    
    # Run linting
    if ! run_linting; then
        warning "Linting completed with warnings"
    fi
    
    # Run security audit
    if ! run_security_audit; then
        warning "Security audit completed with warnings"
    fi
    
    # Build applications
    if ! build_applications; then
        error "Build failed"
        exit_code=1
    fi
    
    if [ $exit_code -eq 0 ]; then
        success "All checks passed! CI/CD pipeline should work correctly."
    else
        error "Some checks failed. Please review the errors above."
    fi
    
    return $exit_code
}

# Show help
show_help() {
    echo "D-CloudX CI/CD Troubleshooting Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --test     Run only tests"
    echo "  -l, --lint     Run only linting"
    echo "  -s, --security Run only security audit"
    echo "  -b, --build    Run only build"
    echo "  -a, --all      Run all checks (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all checks"
    echo "  $0 --test       # Run only tests"
    echo "  $0 --lint       # Run only linting"
    echo "  $0 --security   # Run only security audit"
    echo "  $0 --build      # Run only build"
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    -t|--test)
        check_node_version && check_npm_version && install_dependencies && test_contracts && test_server && test_client
        ;;
    -l|--lint)
        check_node_version && check_npm_version && install_dependencies && run_linting
        ;;
    -s|--security)
        check_node_version && check_npm_version && install_dependencies && run_security_audit
        ;;
    -b|--build)
        check_node_version && check_npm_version && install_dependencies && build_applications
        ;;
    -a|--all|"")
        troubleshoot
        ;;
    *)
        error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

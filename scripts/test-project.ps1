# D-CloudX Complete Project Test Script (PowerShell)
# This script tests all components of the D-CloudX project

param(
    [switch]$Verbose,
    [switch]$SkipBuild,
    [switch]$Quick
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Logging functions
function Write-Log {
    param($Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️ $Message" -ForegroundColor $Yellow
}

# Test tracking
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

function Test-Command {
    param(
        [string]$TestName,
        [scriptblock]$TestCommand
    )
    
    $script:TotalTests++
    Write-Log "Running test: $TestName"
    
    try {
        $result = & $TestCommand
        if ($LASTEXITCODE -eq 0 -or $result) {
            Write-Success "$TestName - PASSED"
            $script:PassedTests++
            return $true
        } else {
            Write-Error "$TestName - FAILED"
            $script:FailedTests++
            return $false
        }
    } catch {
        Write-Error "$TestName - FAILED: $($_.Exception.Message)"
        $script:FailedTests++
        return $false
    }
}

function Test-Prerequisites {
    Write-Log "Testing prerequisites..."
    
    Test-Command "Node.js version check" { 
        $nodeVersion = node --version
        $nodeVersion -match "v(18|20)"
    }
    
    Test-Command "npm version check" { 
        npm --version
    }
    
    Test-Command "Git availability" { 
        git --version
    }
}

function Test-FileStructure {
    Write-Log "Testing project file structure..."
    
    $requiredDirs = @("contracts", "server", "client", "docker", "k8s", "scripts", "docs")
    foreach ($dir in $requiredDirs) {
        Test-Command "$dir directory exists" { Test-Path $dir }
    }
    
    $requiredFiles = @(
        "contracts/package.json",
        "server/package.json", 
        "client/package.json",
        "docker/docker-compose.yml",
        "contracts/hardhat.config.js",
        "readme.md"
    )
    foreach ($file in $requiredFiles) {
        Test-Command "$file exists" { Test-Path $file }
    }
}

function Test-Contracts {
    Write-Log "Testing smart contracts..."
    
    Push-Location contracts
    
    Test-Command "Contract dependencies installation" { 
        npm install --legacy-peer-deps
    }
    
    Test-Command "Contract compilation" { 
        npm run compile
    }
    
    if (-not $Quick) {
        Test-Command "Contract tests" { 
            npm run test
        }
    }
    
    Pop-Location
}

function Test-Server {
    Write-Log "Testing server (NestJS backend)..."
    
    Push-Location server
    
    Test-Command "Server dependencies installation" { 
        npm install
    }
    
    if (-not $Quick) {
        Test-Command "Server tests" { 
            npm run test
        }
    }
    
    if (-not $SkipBuild) {
        Test-Command "Server build" { 
            npm run build
        }
    }
    
    Pop-Location
}

function Test-Client {
    Write-Log "Testing client (Next.js frontend)..."
    
    Push-Location client
    
    Test-Command "Client dependencies installation" { 
        npm install
    }
    
    if (-not $Quick) {
        Test-Command "Client tests" { 
            npm run test
        }
    }
    
    if (-not $SkipBuild) {
        Test-Command "Client build" { 
            npm run build
        }
    }
    
    Pop-Location
}

function Test-Docker {
    Write-Log "Testing Docker configurations..."
    
    Test-Command "Docker availability" { 
        docker --version
    }
    
    Test-Command "Docker Compose validation" { 
        docker-compose -f docker/docker-compose.yml config
    }
}

function Test-Kubernetes {
    Write-Log "Testing Kubernetes manifests..."
    
    $k8sFiles = @(
        "k8s/namespace-configmap-secrets.yaml",
        "k8s/database-services.yaml",
        "k8s/applications.yaml",
        "k8s/monitoring.yaml",
        "k8s/ingress-networking.yaml"
    )
    
    foreach ($file in $k8sFiles) {
        Test-Command "$file validation" { 
            Test-Path $file
        }
    }
}

function Test-Scripts {
    Write-Log "Testing deployment and setup scripts..."
    
    $scripts = @("scripts/deploy.sh", "scripts/setup-dev.sh", "scripts/troubleshoot.sh")
    foreach ($script in $scripts) {
        Test-Command "$script exists" { 
            Test-Path $script
        }
    }
}

function Test-Documentation {
    Write-Log "Testing documentation..."
    
    $docs = @(
        "readme.md",
        "docs/api-documentation.md",
        "docs/architecture.md",
        "docs/deployment-guide.md",
        "docs/troubleshooting-guide.md"
    )
    
    foreach ($doc in $docs) {
        Test-Command "$doc exists" { 
            Test-Path $doc
        }
    }
}

function Test-CICD {
    Write-Log "Testing CI/CD configuration..."
    
    Test-Command "CI/CD workflow exists" { 
        Test-Path ".github/workflows/ci-cd.yml"
    }
}

function Test-Security {
    Write-Log "Running security checks..."
    
    if (-not $Quick) {
        Push-Location contracts
        Test-Command "Contract security audit" { 
            npm audit --audit-level moderate
        }
        Pop-Location
        
        Push-Location server
        Test-Command "Server security audit" { 
            npm audit --audit-level moderate
        }
        Pop-Location
        
        Push-Location client
        Test-Command "Client security audit" { 
            npm audit --audit-level moderate
        }
        Pop-Location
    }
}

function Show-Report {
    Write-Log "Generating test report..."
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host "           D-CloudX Test Report" -ForegroundColor $Blue
    Write-Host "==========================================" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Total Tests: $script:TotalTests"
    Write-Host "Passed: $script:PassedTests" -ForegroundColor $Green
    Write-Host "Failed: $script:FailedTests" -ForegroundColor $Red
    Write-Host ""
    
    if ($script:FailedTests -eq 0) {
        Write-Success "🎉 All tests passed! Project is ready for deployment."
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Deploy to staging environment"
        Write-Host "2. Run integration tests"
        Write-Host "3. Deploy to production"
        Write-Host "4. Monitor application performance"
    } else {
        Write-Error "❌ Some tests failed. Please review and fix the issues."
        Write-Host ""
        Write-Host "Failed tests need to be addressed before deployment."
    }
    
    Write-Host ""
    Write-Host "Test completed at: $(Get-Date)"
    Write-Host "==========================================" -ForegroundColor $Blue
}

# Main function
function Main {
    Write-Log "Starting D-CloudX Complete Project Test Suite..."
    Write-Host ""
    
    if ($Quick) {
        Write-Warning "Running in quick mode - skipping some tests"
    }
    
    if ($SkipBuild) {
        Write-Warning "Skipping build tests"
    }
    
    # Run all test suites
    Test-Prerequisites
    Test-FileStructure
    Test-Contracts
    Test-Server
    Test-Client
    Test-Docker
    Test-Kubernetes
    Test-Scripts
    Test-Documentation
    Test-CICD
    Test-Security
    
    # Generate final report
    Show-Report
    
    # Exit with appropriate code
    if ($script:FailedTests -eq 0) {
        exit 0
    } else {
        exit 1
    }
}

# Run main function
Main

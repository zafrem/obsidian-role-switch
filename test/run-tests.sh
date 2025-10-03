#!/bin/bash

# RoleSwitch API Test Runner Script
# Provides easy command-line interface for running tests

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print header
print_header() {
    echo
    print_color $BLUE "🧪 RoleSwitch API Test Runner"
    echo "=================================="
}

# Function to show help
show_help() {
    print_header
    echo
    echo "Usage: $0 [command] [options]"
    echo
    echo "Commands:"
    echo "  all, test          Run all test suites (default)"
    echo "  api                Run API interface tests only"
    echo "  http               Run HTTP server tests only"
    echo "  integration        Run integration tests only"
    echo "  list               List available test suites"
    echo "  clean              Clean build artifacts"
    echo "  build              Build TypeScript files"
    echo "  watch              Watch for file changes and rebuild"
    echo "  help               Show this help message"
    echo
    echo "Options:"
    echo "  --verbose, -v      Show verbose output"
    echo "  --quiet, -q        Show minimal output"
    echo "  --no-build         Skip TypeScript compilation"
    echo
    echo "Examples:"
    echo "  $0                 # Run all tests"
    echo "  $0 api             # Run API tests only"
    echo "  $0 integration -v  # Run integration tests with verbose output"
    echo "  $0 clean           # Clean build artifacts"
    echo
}

# Function to check dependencies
check_dependencies() {
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js is not installed"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_color $RED "❌ npm is not installed"
        echo "Please install npm (usually comes with Node.js)"
        exit 1
    fi

    if ! command -v npx &> /dev/null; then
        print_color $RED "❌ npx is not installed"
        echo "Please install npx: npm install -g npx"
        exit 1
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_color $YELLOW "📦 Installing dependencies..."
        npm install
    fi
}

# Function to build TypeScript
build_typescript() {
    if [ "$SKIP_BUILD" != "true" ]; then
        print_color $YELLOW "🔨 Building TypeScript..."
        npm run build
    fi
}

# Function to clean build artifacts
clean_build() {
    print_color $YELLOW "🧹 Cleaning build artifacts..."
    npm run clean
    if [ -d "node_modules" ]; then
        print_color $YELLOW "🗑️  Removing node_modules..."
        rm -rf node_modules
    fi
    print_color $GREEN "✅ Clean completed"
}

# Function to run tests
run_tests() {
    local command=$1
    local verbose=$2

    print_header

    # Check if we're in the test directory
    if [ ! -f "package.json" ]; then
        print_color $RED "❌ Not in test directory"
        echo "Please run this script from the test/ directory"
        exit 1
    fi

    check_dependencies
    install_dependencies
    build_typescript

    print_color $BLUE "🚀 Running tests..."
    echo

    case $command in
        "all"|"test"|"")
            if [ "$verbose" = "true" ]; then
                node TestRunner.js 2>&1 | tee test-results.log
            else
                node TestRunner.js
            fi
            ;;
        "api")
            node TestRunner.js suite api
            ;;
        "http")
            node TestRunner.js suite http
            ;;
        "integration")
            node TestRunner.js suite integration
            ;;
        "list")
            node TestRunner.js list
            ;;
        *)
            print_color $RED "❌ Unknown command: $command"
            show_help
            exit 1
            ;;
    esac

    local exit_code=$?

    echo
    if [ $exit_code -eq 0 ]; then
        print_color $GREEN "🎉 All tests passed!"
    else
        print_color $RED "💥 Some tests failed!"
        echo
        print_color $YELLOW "💡 Tips:"
        echo "  • Check test output above for specific failures"
        echo "  • Run with --verbose for more detailed output"
        echo "  • Run specific test suites to isolate issues"
        echo "  • Check test/README.md for troubleshooting guide"
    fi

    return $exit_code
}

# Function to watch for changes
watch_mode() {
    print_header
    print_color $YELLOW "👀 Watching for file changes..."
    print_color $BLUE "Press Ctrl+C to stop"
    echo

    check_dependencies
    install_dependencies

    npm run watch &
    WATCH_PID=$!

    # Trap to kill watch process on exit
    trap "kill $WATCH_PID 2>/dev/null; exit" INT TERM

    wait $WATCH_PID
}

# Parse command line arguments
COMMAND=""
VERBOSE=false
QUIET=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        all|test|api|http|integration|list|clean|build|watch|help)
            COMMAND=$1
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --quiet|-q)
            QUIET=true
            shift
            ;;
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            print_color $RED "❌ Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Set default command
if [ -z "$COMMAND" ]; then
    COMMAND="all"
fi

# Handle special commands
case $COMMAND in
    "help")
        show_help
        exit 0
        ;;
    "clean")
        clean_build
        exit 0
        ;;
    "build")
        print_header
        check_dependencies
        install_dependencies
        build_typescript
        print_color $GREEN "✅ Build completed"
        exit 0
        ;;
    "watch")
        watch_mode
        exit 0
        ;;
    *)
        # Run tests
        run_tests "$COMMAND" "$VERBOSE"
        exit $?
        ;;
esac
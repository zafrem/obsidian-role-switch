# RoleSwitch API Tests

Comprehensive unit and integration tests for the RoleSwitch Plugin REST API.

## Overview

This test suite validates the complete API functionality including:

- **API Interface Tests**: Core API logic and data manipulation
- **HTTP Server Tests**: REST endpoint handling and HTTP protocol compliance
- **Integration Tests**: End-to-end workflows and real-world usage scenarios

## Test Structure

```
test/
├── TestSetup.ts           # Mock plugin and test utilities
├── ApiInterface.test.ts   # API interface unit tests
├── HttpServer.test.ts     # HTTP server unit tests
├── Integration.test.ts    # Integration and workflow tests
├── TestRunner.ts          # Main test runner
├── package.json           # Test dependencies and scripts
└── README.md             # This file
```

## Quick Start

### Prerequisites

Make sure you have Node.js and npm installed. The tests use TypeScript and require compilation.

### Running Tests

```bash
# Navigate to test directory
cd test

# Install dependencies (if needed)
npm install

# Run all tests
npm test

# Run specific test suite
npm run test:api          # API interface tests
npm run test:http         # HTTP server tests
npm run test:integration  # Integration tests

# List available test suites
npm run test:list

# Get help
npm test help
```

### Alternative: Run from project root

```bash
# From the plugin root directory
cd test && npm test
```

## Test Suites

### 1. API Interface Tests (`ApiInterface.test.ts`)

Tests the core API logic without HTTP layer:

- **Status Operations**: Current plugin state, active sessions, lock status
- **Role Management**: CRUD operations for roles
- **Session Management**: Starting, switching, ending sessions
- **Notes Management**: Adding, updating, deleting session notes
- **Events**: Event logging and filtering
- **Analytics**: Time tracking and statistical analysis

**Key Test Cases:**
- ✅ Role creation with validation
- ✅ Session lifecycle management
- ✅ Session locking behavior
- ✅ Note association with sessions
- ✅ Event filtering by type and date
- ✅ Analytics calculations and aggregations

### 2. HTTP Server Tests (`HttpServer.test.ts`)

Tests the REST API endpoints and HTTP protocol handling:

- **HTTP Compliance**: Status codes, headers, CORS
- **Request Parsing**: Path parameters, query strings, request bodies
- **Error Handling**: Validation errors, not found, server errors
- **Endpoint Coverage**: All API endpoints with various scenarios

**Key Test Cases:**
- ✅ CORS header inclusion
- ✅ OPTIONS preflight requests
- ✅ Path parameter extraction
- ✅ Query parameter parsing
- ✅ Request body validation
- ✅ Error response formatting

### 3. Integration Tests (`Integration.test.ts`)

Tests complete workflows and real-world usage scenarios:

- **Complete Workflows**: End-to-end role and session management
- **Data Consistency**: State management across operations
- **Error Scenarios**: Edge cases and error recovery
- **Concurrent Operations**: Simulated multi-user scenarios

**Key Test Cases:**
- ✅ Complete role management workflow
- ✅ Session lifecycle with role switching
- ✅ Notes workflow with sessions
- ✅ Events and analytics generation
- ✅ Error handling and recovery
- ✅ Concurrent operation handling

## Test Features

### Mock Plugin System

The test suite includes a comprehensive mock plugin (`MockPlugin`) that simulates the actual Obsidian plugin behavior:

```typescript
const mockPlugin = new MockPlugin();
const api = new RoleSwitchApi(mockPlugin, 3030);

// Simulate plugin operations
mockPlugin.addTestRole('Developer', '#3498db');
mockPlugin.startSession(roleId);
mockPlugin.setSessionLocked(false);
```

### Test Utilities

Helper functions for common test operations:

```typescript
// Create test data
const role = TestUtils.createTestRole({ name: 'Tester' });
const session = TestUtils.createTestSession({ roleId: role.id });

// Assertions
TestUtils.assertDeepEqual(actual, expected);
TestUtils.expectError(() => someFunction(), 'Expected error message');

// Async utilities
await TestUtils.delay(100); // Wait 100ms
await TestUtils.expectAsyncError(asyncFunction, 'Error message');
```

### Simple Test Runner

Custom test runner with clean output and error reporting:

```typescript
const runner = new TestRunner();

runner.beforeEach(() => {
    // Setup before each test
});

runner.test('Test description', () => {
    // Test implementation
});

await runner.run(); // Execute all tests
```

## Test Coverage

### API Endpoints Tested

| Endpoint | Method | Test Coverage |
|----------|---------|---------------|
| `/api/status` | GET | ✅ Complete |
| `/api/roles` | GET, POST | ✅ Complete |
| `/api/roles/:id` | GET, PUT, DELETE | ✅ Complete |
| `/api/sessions/start` | POST | ✅ Complete |
| `/api/sessions/switch` | POST | ✅ Complete |
| `/api/sessions/end` | POST | ✅ Complete |
| `/api/sessions` | GET | ✅ Complete |
| `/api/notes` | POST | ✅ Complete |
| `/api/notes/:id` | PUT, DELETE | ✅ Complete |
| `/api/events` | GET | ✅ Complete |
| `/api/analytics` | GET | ✅ Complete |

### Scenarios Tested

- ✅ **Happy Path**: All operations work as expected
- ✅ **Validation**: Required fields, data types, formats
- ✅ **Not Found**: Operations on non-existent resources
- ✅ **Conflicts**: Session locks, invalid state transitions
- ✅ **Edge Cases**: Empty data, boundary conditions
- ✅ **Error Recovery**: System remains stable after errors
- ✅ **Data Integrity**: Operations don't corrupt plugin state

## Adding New Tests

### 1. Unit Tests

Add tests to the appropriate test file:

```typescript
runner.test('My new test', () => {
    // Setup
    const role = mockPlugin.addTestRole('Test Role', '#ffffff');

    // Execute
    const result = api.someNewMethod(role.id);

    // Verify
    if (!result.success) {
        throw new Error('Expected operation to succeed');
    }

    if (result.data.someProperty !== 'expectedValue') {
        throw new Error('Property mismatch');
    }
});
```

### 2. Integration Tests

Add workflow tests to `Integration.test.ts`:

```typescript
runner.test('My workflow test', async () => {
    // Create test scenario
    const roleResponse = await makeRequest('POST', '/api/roles', testRoleData);

    // Execute workflow steps
    const step1 = await makeRequest('POST', '/api/sessions/start', { roleId: roleResponse.body.data.id });
    const step2 = await makeRequest('POST', '/api/notes', { sessionId: step1.sessionId, text: 'Test' });

    // Verify end state
    const finalState = await makeRequest('GET', '/api/status');
    // ... assertions
});
```

### 3. Mock Plugin Extensions

Extend the mock plugin for new functionality:

```typescript
// In TestSetup.ts
export class MockPlugin {
    someNewMethod(param: string): SomeType {
        // Implementation that mimics plugin behavior
        return { id: 'test', value: param };
    }
}
```

## Continuous Integration

The test suite is designed to work with CI/CD systems:

```bash
# In CI script
cd test
npm install
npm test

# Exit code 0 = all tests pass
# Exit code 1 = some tests failed
```

## Troubleshooting

### Common Issues

1. **TypeScript Compilation Errors**
   ```bash
   npm run clean
   npm run build
   ```

2. **Test Timeouts**
   - Check for infinite loops in test logic
   - Verify mock plugin state is reset between tests

3. **Inconsistent Test Results**
   - Ensure tests don't depend on external state
   - Verify `beforeEach` properly resets test environment

### Debug Mode

Add debug output to tests:

```typescript
runner.test('Debug test', () => {
    console.log('Current plugin state:', JSON.stringify(mockPlugin.data, null, 2));
    // ... test logic
});
```

### Test Data Inspection

```typescript
// View test data between operations
const sessions = mockPlugin.getDerivedSessions();
console.log('Sessions:', sessions);

const events = mockPlugin.data.events;
console.log('Events:', events);
```

## Performance Considerations

- Tests use in-memory mock data (no file I/O)
- Each test suite runs independently
- Mock plugin resets between tests
- Tests typically complete in < 5 seconds total

## Contributing

When adding new API features:

1. Add unit tests in appropriate test file
2. Add integration tests for new workflows
3. Update test coverage table in this README
4. Ensure all tests pass before submitting

## Future Enhancements

- [ ] Load testing with high request volumes
- [ ] Network error simulation
- [ ] Performance benchmarking
- [ ] Test data generation for large datasets
- [ ] Browser-based test runner for UI testing
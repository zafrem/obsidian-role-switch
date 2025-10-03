// Main test runner that executes all test suites

import { runner as apiInterfaceTests } from './ApiInterface.test';
import { runner as httpServerTests } from './HttpServer.test';
import { runner as integrationTests } from './Integration.test';

interface TestSuite {
    name: string;
    runner: any;
}

interface TestResults {
    suiteName: string;
    passed: number;
    failed: number;
    errors: Array<{ test: string; error: string }>;
}

class MainTestRunner {
    private suites: TestSuite[] = [
        { name: 'API Interface Tests', runner: apiInterfaceTests },
        { name: 'HTTP Server Tests', runner: httpServerTests },
        { name: 'Integration Tests', runner: integrationTests }
    ];

    async runAllTests(): Promise<{
        totalPassed: number;
        totalFailed: number;
        suiteResults: TestResults[];
        success: boolean;
    }> {
        console.log('🚀 Starting RoleSwitch API Test Suite\n');
        console.log('=' .repeat(60));

        const suiteResults: TestResults[] = [];
        let totalPassed = 0;
        let totalFailed = 0;

        for (const suite of this.suites) {
            console.log(`\n📋 Running ${suite.name}`);
            console.log('-'.repeat(40));

            try {
                const results = await suite.runner.run();

                const suiteResult: TestResults = {
                    suiteName: suite.name,
                    passed: results.passed,
                    failed: results.failed,
                    errors: results.errors
                };

                suiteResults.push(suiteResult);
                totalPassed += results.passed;
                totalFailed += results.failed;

                console.log(`✅ ${suite.name}: ${results.passed} passed, ${results.failed} failed`);

            } catch (error) {
                console.log(`❌ ${suite.name}: Failed to run - ${error}`);
                const suiteResult: TestResults = {
                    suiteName: suite.name,
                    passed: 0,
                    failed: 1,
                    errors: [{ test: 'Suite Execution', error: String(error) }]
                };
                suiteResults.push(suiteResult);
                totalFailed += 1;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 FINAL RESULTS');
        console.log('='.repeat(60));

        console.log(`Total Tests: ${totalPassed + totalFailed}`);
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);
        console.log(`Success Rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);

        if (totalFailed > 0) {
            console.log('\n🔍 FAILURE DETAILS:');
            console.log('-'.repeat(40));

            for (const suite of suiteResults) {
                if (suite.failed > 0) {
                    console.log(`\n${suite.suiteName}:`);
                    for (const error of suite.errors) {
                        console.log(`  • ${error.test}: ${error.error}`);
                    }
                }
            }
        }

        const success = totalFailed === 0;
        console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED!'}`);

        return {
            totalPassed,
            totalFailed,
            suiteResults,
            success
        };
    }

    async runSuite(suiteName: string): Promise<TestResults | null> {
        const suite = this.suites.find(s =>
            s.name.toLowerCase().includes(suiteName.toLowerCase())
        );

        if (!suite) {
            console.log(`❌ Test suite "${suiteName}" not found`);
            console.log('Available suites:');
            this.suites.forEach(s => console.log(`  • ${s.name}`));
            return null;
        }

        console.log(`🚀 Running ${suite.name}\n`);

        try {
            const results = await suite.runner.run();

            return {
                suiteName: suite.name,
                passed: results.passed,
                failed: results.failed,
                errors: results.errors
            };
        } catch (error) {
            console.log(`❌ Failed to run ${suite.name}: ${error}`);
            return {
                suiteName: suite.name,
                passed: 0,
                failed: 1,
                errors: [{ test: 'Suite Execution', error: String(error) }]
            };
        }
    }

    listSuites(): void {
        console.log('📋 Available Test Suites:');
        console.log('-'.repeat(30));
        this.suites.forEach((suite, index) => {
            console.log(`${index + 1}. ${suite.name}`);
        });
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const testRunner = new MainTestRunner();

    if (args.length === 0) {
        // Run all tests
        const results = await testRunner.runAllTests();
        process.exit(results.success ? 0 : 1);
    } else {
        const command = args[0].toLowerCase();

        switch (command) {
            case 'list':
            case 'ls':
                testRunner.listSuites();
                break;

            case 'suite':
            case 'run':
                if (args.length < 2) {
                    console.log('❌ Please specify a suite name');
                    testRunner.listSuites();
                    process.exit(1);
                }

                const results = await testRunner.runSuite(args[1]);
                if (results) {
                    process.exit(results.failed > 0 ? 1 : 0);
                } else {
                    process.exit(1);
                }
                break;

            case 'help':
            case '-h':
            case '--help':
                console.log('🧪 RoleSwitch API Test Runner');
                console.log('\nUsage:');
                console.log('  npm test              - Run all test suites');
                console.log('  npm test list         - List available test suites');
                console.log('  npm test suite <name> - Run specific test suite');
                console.log('  npm test help         - Show this help message');
                console.log('\nExamples:');
                console.log('  npm test suite api         - Run API interface tests');
                console.log('  npm test suite http        - Run HTTP server tests');
                console.log('  npm test suite integration - Run integration tests');
                break;

            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('Use "npm test help" for usage information');
                process.exit(1);
        }
    }
}

// Export for programmatic use
export { MainTestRunner };
export type { TestResults };

// Run if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner error:', error);
        process.exit(1);
    });
}
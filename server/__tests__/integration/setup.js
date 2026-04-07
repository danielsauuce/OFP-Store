/**
 * Integration test setup
 *
 * Runs BEFORE any test file imports app.js.
 * Sets the environment variables that the middleware layer depends on.
 */

// JWT secret must match the one used by helpers.js
process.env.JWT_SECRET = 'integration-test-secret';

// CORS needs CLIENT_URL to whitelist origins (empty string allows all in tests)
process.env.CLIENT_URL = 'http://localhost:3000';

// Ensure NODE_ENV is set
process.env.NODE_ENV = 'test';

// Stripe requires an API key at module instantiation — provide a dummy test key
// so stripeService.js can be imported without throwing
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_for_tests';

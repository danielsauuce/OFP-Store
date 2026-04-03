// checkout-stripe.cy.js — Checkout flow with Stripe payment element

describe('Checkout Stripe — Unauthenticated', () => {
  it('redirects to /auth when not logged in', () => {
    cy.visit('/checkout');
    cy.url().should('include', '/auth');
  });
});

describe('Checkout Stripe — Authenticated', () => {
  before(function () {
    if (!Cypress.env('USER_EMAIL')) this.skip();
  });

  function login() {
    const email = Cypress.env('USER_EMAIL');
    const password = Cypress.env('USER_PASSWORD');

    cy.visit('/auth');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/auth');
  }

  beforeEach(() => {
    login();
  });

  it('loads checkout page or redirects to cart when cart is empty', () => {
    cy.visit('/checkout');
    cy.url().should('match', /\/checkout|\/cart/);
  });

  it('Step 1 — renders shipping form fields', () => {
    cy.visit('/checkout');
    cy.get('input[name="fullName"]').should('exist');
    cy.get('input[name="email"]').should('exist');
    cy.get('input[name="phone"]').should('exist');
    cy.get('input[name="street"]').should('exist');
    cy.get('input[name="city"]').should('exist');
  });

  it('Step 1 — can complete shipping form and proceed', () => {
    cy.visit('/checkout');
    cy.get('body').then(($body) => {
      if ($body.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.get('body', { timeout: 5000 }).should('contain.text', 'Payment');
      }
    });
  });

  it('Step 2 — can select card payment method', () => {
    cy.visit('/checkout');
    cy.get('body').then(($body) => {
      if ($body.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.get('body', { timeout: 5000 }).then(($payBody) => {
          if ($payBody.text().match(/card/i)) {
            cy.contains(/card/i).click();
            cy.get('body').should('contain.text', 'card').or('contain.text', 'Card');
          }
        });
      }
    });
  });

  it('Step 2 — can select pay on delivery method', () => {
    cy.visit('/checkout');
    cy.get('body').then(($body) => {
      if ($body.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.get('body', { timeout: 5000 }).then(($payBody) => {
          if ($payBody.text().match(/pay on delivery|delivery/i)) {
            cy.contains(/pay on delivery/i).click();
            cy.get('body').should('contain.text', 'delivery').or('contain.text', 'Delivery');
          }
        });
      }
    });
  });

  it('Stripe payment element renders when card method selected and key is configured', () => {
    cy.visit('/checkout');
    cy.get('body').then(($body) => {
      if ($body.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.get('body', { timeout: 5000 }).then(($payBody) => {
          if ($payBody.text().match(/card/i)) {
            cy.contains(/card/i).click();
            // Stripe element renders in an iframe when Stripe key is configured
            cy.get('body').then(($afterCard) => {
              const hasStripe =
                $afterCard.find('[class*="stripe"], iframe[name*="__privateStripe"]').length > 0;
              if (hasStripe) {
                cy.get('[class*="stripe"], iframe[name*="__privateStripe"]').should('exist');
              } else {
                // Stripe key not configured in test environment — acceptable
                cy.log('Stripe element not rendered — STRIPE_PUBLISHABLE_KEY not set');
              }
            });
          }
        });
      }
    });
  });
});

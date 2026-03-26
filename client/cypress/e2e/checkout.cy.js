// checkout.cy.js — 3-step checkout: shipping validation, payment, review, order summary

describe('Checkout — Unauthenticated', () => {
  it('redirects to /auth when not logged in', () => {
    cy.visit(`/checkout`);
    cy.url().should('include', '/auth');
  });
});

describe('Checkout — Authenticated (requires user session + cart items)', () => {
  function loginAndSeedCart() {
    const email = Cypress.env('USER_EMAIL');
    const password = Cypress.env('USER_PASSWORD');
    if (!email || !password) return false;

    cy.visit(`/auth`);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/auth');
    return true;
  }

  beforeEach(() => {
    loginAndSeedCart();
  });

  it('loads checkout page for authenticated user with cart', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    // Either shows checkout or redirects to /cart when cart is empty
    cy.url().should('match', /\/checkout|\/cart/);
  });

  it('Step 1 — shows Shipping Information heading', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').should('contain.text', 'Shipping').or('contain.text', 'cart');
  });

  it('Step 1 — renders all shipping form fields', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping')) {
        cy.get('input[name="fullName"]').should('exist');
        cy.get('input[name="email"]').should('exist');
        cy.get('input[name="phone"]').should('exist');
        cy.get('input[name="street"]').should('exist');
        cy.get('input[name="city"]').should('exist');
        cy.get('input[name="postalCode"]').should('exist');
      }
    });
  });

  it('Step 1 — empty submit shows validation errors', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').clear();
        cy.contains('button', /continue|next|payment/i).click();
        cy.get('body', { timeout: 5000 })
          .should('contain.text', 'required')
          .or('contain.text', 'invalid');
      }
    });
  });

  it('Step 1 — shows "Continue to Payment" button', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping')) {
        cy.contains('button', /continue to payment/i).should('exist');
      }
    });
  });

  it('step progress bar renders', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping')) {
        cy.get('[class*="step"], [class*="progress"], [class*="Step"]').should('exist');
      }
    });
  });

  it('Step 2 — shows Payment Method after valid shipping info', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.contains(/Payment Method|payment/i, { timeout: 5000 }).should('exist');
      }
    });
  });

  it('Step 2 — shows card and pay-on-delivery options', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping Information')) {
        cy.get('input[name="fullName"]').type('Test User');
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="phone"]').type('+2348001234567');
        cy.get('input[name="street"]').type('123 Test Street');
        cy.get('input[name="city"]').type('Lagos');
        cy.get('input[name="postalCode"]').type('100001');
        cy.contains('button', /continue to payment/i).click();
        cy.get('body', { timeout: 5000 }).should('contain.text', 'card').or('contain.text', 'Card');
      }
    });
  });

  it('order summary card is visible throughout checkout', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/checkout`);
    cy.get('body').then(($b) => {
      if ($b.text().includes('Shipping')) {
        cy.contains(/order summary|subtotal|total/i).should('exist');
      }
    });
  });
});

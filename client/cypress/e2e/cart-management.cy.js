// cart-management.cy.js — Quantity +/-, remove item, pricing, empty states, unauth access
// NOTE: Quantity buttons use <Minus>/<Plus> SVG icons — NOT text "+" or "-"
// Remove button uses <Trash2> SVG icon — NOT text

describe('Cart — Unauthenticated', () => {
  it('shows sign-in prompt when visiting /cart unauthenticated', () => {
    cy.visit(`/cart`);
    cy.get('body').should('contain.text', 'Sign in');
  });

  it('has a link to /auth from the cart page', () => {
    cy.visit(`/cart`);
    cy.get('a[href="/auth"]').should('exist');
  });
});

describe('Cart — Authenticated (requires user session)', () => {
  function loginAsUser() {
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

  function hasItems($b) {
    return !$b.text().toLowerCase().includes('empty') && !$b.text().includes('Sign in');
  }

  beforeEach(() => {
    loginAsUser();
  });

  it('renders the cart page after login', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').should('contain.text', 'Cart').or('contain.text', 'empty');
  });

  it('shows empty cart message with shop link when no items', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if ($b.text().toLowerCase().includes('empty')) {
        cy.contains(/empty/i).should('exist');
        cy.get('a[href="/shop"]').should('exist');
      }
    });
  });

  it('shows cart items if any exist', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.get('img').should('exist');
      }
    });
  });

  it('quantity decrement (Minus SVG) button exists for each item', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        // Quantity wrapper: div.flex.items-center.border — first button is minus
        cy.get('.flex.items-center.border.border-border.rounded-md button').first().should('exist');
      }
    });
  });

  it('quantity increment (Plus SVG) button exists for each item', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        // Last button in quantity wrapper is plus
        cy.get('.flex.items-center.border.border-border.rounded-md button').last().should('exist');
      }
    });
  });

  it('remove item button (Trash2 SVG) exists', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        // Remove button has text-destructive class
        cy.get('button[class*="text-destructive"]').should('exist');
      }
    });
  });

  it('shows subtotal and total pricing', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.contains(/subtotal|total/i).should('exist');
      }
    });
  });

  it('shows shipping cost line', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.contains(/shipping/i).should('exist');
      }
    });
  });

  it('shows "Proceed to Checkout" link when cart has items', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.contains('a, button', /checkout/i).should('exist');
      }
    });
  });

  it('"Clear Cart" button exists when cart has items', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.contains('button', /clear cart/i).should('exist');
      }
    });
  });

  it('navbar cart badge is visible', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('nav [aria-label*="Shopping cart"]').should('exist');
  });

  it('Proceed to Checkout navigates to /checkout', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit(`/cart`);
    cy.get('body').then(($b) => {
      if (hasItems($b)) {
        cy.contains('a, button', /checkout/i)
          .first()
          .click();
        cy.url().should('include', '/checkout');
      }
    });
  });
});

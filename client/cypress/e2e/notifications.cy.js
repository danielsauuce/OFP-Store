// notifications.cy.js — Notification centre page tests

describe('Notifications — Unauthenticated', () => {
  it('redirects to /auth when not logged in', () => {
    cy.visit('/notifications');
    cy.url().should('include', '/auth');
  });
});

describe('Notifications — Authenticated', () => {
  function login() {
    const email = Cypress.env('USER_EMAIL');
    const password = Cypress.env('USER_PASSWORD');
    if (!email || !password) return false;

    cy.visit('/auth');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/auth');
    return true;
  }

  beforeEach(() => {
    login();
  });

  it('loads notifications page after login', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/notifications');
    cy.url().should('include', '/notifications');
  });

  it('page body contains notification-related text', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/notifications');
    cy.get('body', { timeout: 8000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(text.includes('notification') || text.includes('no notifications')).to.be.true;
    });
  });

  it('shows "Mark all as read" button or empty state', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/notifications');
    cy.get('body', { timeout: 8000 }).then(($body) => {
      const text = $body.text();
      if (text.match(/mark all|mark all as read/i)) {
        cy.contains(/mark all/i).should('exist');
      } else {
        cy.contains(/no notifications|no new/i).should('exist');
      }
    });
  });
});

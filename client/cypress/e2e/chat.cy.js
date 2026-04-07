// chat.cy.js — Chat widget tests

describe('Chat Widget — Unauthenticated', () => {
  it('chat widget button is not visible for unauthenticated users', () => {
    cy.visit('/');
    cy.get('[aria-label*="chat" i], [aria-label*="Chat" i], [class*="chat-widget"]').should(
      'not.exist',
    );
  });
});

describe('Chat Widget — Authenticated', () => {
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

  it('chat widget button is visible after login on a public page', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/');
    // The chat FAB button should be visible
    cy.get('button[aria-label*="chat" i], button[aria-label*="support" i]', { timeout: 8000 })
      .should('exist')
      .and('be.visible');
  });

  it('clicking the chat button opens the chat modal', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/');
    cy.get('button[aria-label*="chat" i], button[aria-label*="support" i]', { timeout: 8000 })
      .first()
      .click();
    // After clicking, the chat panel should become visible with messaging UI
    cy.get('div[class*="shadow-2xl"][class*="rounded-2xl"]', { timeout: 5000 }).should(
      'be.visible',
    );
    cy.get('textarea, input[placeholder*="message" i]', { timeout: 5000 }).should('exist');
  });

  it('chat modal has a message input', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/');
    cy.get('button[aria-label*="chat" i], button[aria-label*="support" i]', { timeout: 8000 })
      .first()
      .click();
    // The message input should be visible in the chat panel
    cy.get('textarea[placeholder*="message" i], textarea[placeholder*="type" i]', {
      timeout: 5000,
    }).should('exist');
  });

  it('can type a message in the chat input', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.visit('/');
    cy.get('button[aria-label*="chat" i], button[aria-label*="support" i]', { timeout: 8000 })
      .first()
      .click();
    // Find the message input and type in it
    cy.get('textarea[placeholder*="message" i], textarea[placeholder*="type" i]', {
      timeout: 5000,
    })
      .first()
      .type('Hello support team')
      .should('have.value', 'Hello support team');
  });
});

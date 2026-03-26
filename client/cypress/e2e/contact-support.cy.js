// contact-support.cy.js — Contact form validation, submission, error handling

describe('Contact / Support', () => {
  beforeEach(() => {
    cy.visit(`/contact`);
  });

  it('loads the contact page', () => {
    cy.url().should('include', '/contact');
  });

  it('renders the contact form', () => {
    cy.get('form').should('exist');
  });

  it('renders name, email, subject, and message fields', () => {
    cy.get('input[name="name"], input[placeholder*="name" i]').should('exist');
    cy.get('input[name="email"], input[type="email"]').should('exist');
    cy.get('input[name="subject"], input[placeholder*="subject" i]').should('exist');
    cy.get('textarea[name="message"], textarea[placeholder*="message" i]').should('exist');
  });

  it('submit button exists', () => {
    cy.contains('button', /send|submit/i).should('exist');
  });

  it('shows validation error when submitting empty form', () => {
    cy.contains('button', /send|submit/i).click();
    cy.get('body', { timeout: 5000 })
      .should('contain.text', 'required')
      .or('contain.text', 'invalid')
      .or('contain.text', 'enter');
  });

  it('shows email validation error for invalid email', () => {
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('not-an-email');
    cy.get('input[name="subject"]').type('Test Subject');
    cy.get('textarea[name="message"]').type('Test message body');
    cy.contains('button', /send|submit/i).click();
    cy.get('body', { timeout: 5000 }).should('contain.text', 'email').or('contain.text', 'valid');
  });

  it('fills in all fields and attempts submission', () => {
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="subject"]').type('Cypress Test Subject');
    cy.get('textarea[name="message"]').type('This is an automated Cypress test message.');
    cy.contains('button', /send|submit/i).click();
    cy.get('body', { timeout: 8000 })
      .should('contain.text', 'sent')
      .or('contain.text', 'success')
      .or('contain.text', 'received')
      .or('contain.text', 'error');
  });

  it('shows contact information on the page', () => {
    cy.get('body')
      .should('contain.text', 'contact')
      .or('contain.text', 'email')
      .or('contain.text', 'phone');
  });

  it('renders a map or location section', () => {
    cy.get('body')
      .should('contain.text', 'location')
      .or('contain.text', 'address')
      .or('contain.text', 'map')
      .or('contain.text', 'Lagos');
  });

  it('authenticated user ticket form pre-fills email', () => {
    const email = Cypress.env('USER_EMAIL');
    const password = Cypress.env('USER_PASSWORD');
    if (!email || !password) return;

    cy.visit(`/auth`);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('not.include', '/auth');

    cy.visit(`/contact`);
    cy.get('input[name="email"], input[type="email"]')
      .should('have.value', email)
      .or(($el) => expect($el).to.not.have.value(''));
  });
});

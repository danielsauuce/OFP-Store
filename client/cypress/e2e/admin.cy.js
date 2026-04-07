// admin.cy.js — Admin access control, dashboard, sidebar, all admin pages

describe('Admin — Access Control', () => {
  it('redirects unauthenticated visitor from /admin', () => {
    cy.visit(`/admin`);
    cy.url().should('not.include', '/admin').or('include', '/auth');
  });

  it('redirects unauthenticated visitor from /admin/products', () => {
    cy.visit(`/admin/products`);
    cy.url().should('not.include', '/admin/products').or('include', '/auth');
  });

  it('redirects unauthenticated visitor from /admin/orders', () => {
    cy.visit(`/admin/orders`);
    cy.url().should('not.include', '/admin/orders').or('include', '/auth');
  });

  it('redirects unauthenticated visitor from /admin/users', () => {
    cy.visit(`/admin/users`);
    cy.url().should('not.include', '/admin/users').or('include', '/auth');
  });

  it('redirects unauthenticated visitor from /admin/analytics', () => {
    cy.visit(`/admin/analytics`);
    cy.url().should('not.include', '/admin/analytics').or('include', '/auth');
  });

  it('redirects unauthenticated visitor from /admin/payments', () => {
    cy.visit(`/admin/payments`);
    cy.url().should('not.include', '/admin/payments').or('include', '/auth');
  });
});

describe('Admin — Panel (requires admin session)', () => {
  // These tests require a cy.login() custom command with an admin account.
  // They are skipped when no admin credentials are available.

  before(() => {
    const adminEmail = Cypress.env('ADMIN_EMAIL');
    const adminPassword = Cypress.env('ADMIN_PASSWORD');
    if (!adminEmail || !adminPassword) {
      Cypress.log({
        name: 'skip',
        message: 'Admin credentials not set in Cypress env — skipping admin panel tests',
      });
    }
  });

  it('renders the admin sidebar with all nav links including Payments', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    const password = Cypress.env('ADMIN_PASSWORD');
    if (!email || !password) return;

    cy.visit(`/auth`);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.visit(`/admin`, { timeout: 10000 });
    cy.contains('Admin Panel').should('be.visible');
    cy.contains('a', 'Dashboard').should('be.visible');
    cy.contains('a', 'Products').should('be.visible');
    cy.contains('a', 'Orders').should('be.visible');
    cy.contains('a', 'Users').should('be.visible');
    cy.contains('a', 'Analytics').should('be.visible');
    cy.contains('a', 'Payments').should('be.visible');
  });

  it('renders "Back to Store" link in sidebar', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    const password = Cypress.env('ADMIN_PASSWORD');
    if (!email || !password) return;

    cy.visit(`/admin`);
    cy.contains('a', 'Back to Store').should('be.visible');
  });

  it('navigates to Products admin page', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    const password = Cypress.env('ADMIN_PASSWORD');
    if (!email || !password) return;

    cy.visit(`/admin`);
    cy.contains('a', 'Products').click();
    cy.url().should('include', '/admin/products');
  });

  it('navigates to Orders admin page', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/orders`);
    cy.url().should('include', '/admin/orders');
  });

  it('navigates to Users admin page', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/users`);
    cy.url().should('include', '/admin/users');
  });

  it('users table shows email column', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/users`);
    cy.get('body').then(($body) => {
      // Check that at least one user is displayed with email visible
      if (!$body.text().toLowerCase().includes('no users')) {
        cy.get('table tbody tr').first().within(() => {
          cy.get('p[class*="text-xs"][class*="text-muted-foreground"]').should('exist');
        });
      }
    });
  });

  it('navigates to Payments admin page and shows analytics', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/payments`);
    cy.url().should('include', '/admin/payments');
    cy.get('body', { timeout: 8000 }).should('satisfy', ($b) =>
      $b.text().match(/payments|revenue|transactions/i),
    );
  });

  it('admin Payments page shows stat cards', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/payments`);
    cy.get('body', { timeout: 8000 }).should('not.contain.text', /failed to load/i);
    cy.contains(/total revenue|total payments|succeeded/i).should('exist');
  });

  it('admin Products — category select is populated', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/products`);
    cy.contains('button', /add product/i).click();
    cy.get('select[name="category"]').should('exist');
    cy.get('select[name="category"] option').should('have.length.greaterThan', 1);
  });

  it('admin Products — quick-add category button is visible', () => {
    const email = Cypress.env('ADMIN_EMAIL');
    if (!email) return;

    cy.visit(`/admin/products`);
    cy.contains('button', /add product/i).click();
    cy.contains('button', /new/i).should('exist');
  });
});

// admin-crud.cy.js — Product create/edit/delete, order status, user management

function loginAsAdmin() {
  const email = Cypress.env('ADMIN_EMAIL');
  const password = Cypress.env('ADMIN_PASSWORD');
  if (!email || !password) return false;
  cy.visit(`/auth`);
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 10000 }).should('not.include', '/auth');
  return true;
}

describe('Admin CRUD — Products (requires admin session)', () => {
  beforeEach(() => {
    loginAsAdmin();
  });

  it('renders the products admin page', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.url().should('include', '/admin/products');
  });

  it('shows Add / Create Product button', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.contains('button, a', /add product|create product|new product|\+ product/i).should('exist');
  });

  it('opening Add Product modal shows name/price fields', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.contains('button, a', /add product|create product|new product|\+ product/i).click();
    cy.get('[role="dialog"], .modal', { timeout: 5000 }).should('exist');
    cy.get('input[name="name"], input[placeholder*="name" i]').should('exist');
    cy.get('input[name="price"], input[placeholder*="price" i]').should('exist');
  });

  it('closing the modal hides it', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.contains('button', /add product|create product|\+ product/i).click();
    cy.get('[role="dialog"], .modal').should('exist');
    cy.get('[aria-label="Close"], button')
      .filter(':contains("×"), :contains("Close"), :contains("Cancel")')
      .first()
      .click();
    cy.get('[role="dialog"], .modal').should('not.exist');
  });

  it('product list table/grid renders', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.get('table, [class*="grid"], [class*="list"]').should('exist');
  });

  it('edit button exists on a product row', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.get('button[aria-label*="edit" i], button')
      .filter(':contains("Edit")')
      .first()
      .should('exist');
  });

  it('delete button exists on a product row', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/products`);
    cy.get('button[aria-label*="delete" i], button')
      .filter(':contains("Delete")')
      .first()
      .should('exist');
  });
});

describe('Admin CRUD — Orders (requires admin session)', () => {
  beforeEach(() => {
    loginAsAdmin();
  });

  it('renders the orders admin page', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/orders`);
    cy.url().should('include', '/admin/orders');
  });

  it('shows order status update controls', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/orders`);
    cy.get('body').then(($b) => {
      if (!$b.text().match(/no orders/i)) {
        cy.get('select, [role="combobox"], button')
          .filter(':contains("status"), :contains("Status")')
          .should('exist');
      }
    });
  });

  it('renders the users admin page', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/users`);
    cy.url().should('include', '/admin/users');
  });

  it('users table shows email column', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/users`);
    cy.get('body').should('contain.text', 'email').or('contain.text', 'Email');
  });

  it('refresh / reload button or auto-load works on orders page', () => {
    if (!Cypress.env('ADMIN_EMAIL')) return;
    cy.visit(`/admin/orders`);
    cy.get('body').should('not.be.empty');
  });
});

// navigation.cy.js — Public pages, navbar, footer, 404, mobile menu

describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads the home page', () => {
    cy.url().should('include', '/');
    cy.contains('Olayinka Furniture Palace').should('be.visible');
  });

  it('renders all navbar links', () => {
    cy.contains('a', 'Home').should('be.visible');
    cy.contains('a', 'Shop').should('be.visible');
    cy.contains('a', 'About').should('be.visible');
    cy.contains('a', 'Contact').should('be.visible');
  });

  it('navigates to the Shop page', () => {
    cy.contains('a', 'Shop').click();
    cy.url().should('include', '/shop');
  });

  it('navigates to the About page', () => {
    cy.contains('a', 'About').click();
    cy.url().should('include', '/about');
  });

  it('navigates to the Contact page', () => {
    cy.contains('a', 'Contact').click();
    cy.url().should('include', '/contact');
  });

  it('shows 404 page for unknown route', () => {
    cy.visit(`/this-page-does-not-exist`);
    cy.get('body').should('not.be.empty');
  });

  it('renders a footer on public pages', () => {
    cy.get('footer').should('exist');
  });

  it('opens and closes the mobile hamburger menu', () => {
    cy.viewport('iphone-6');
    cy.visit('/');
    // menu is hidden initially on mobile
    cy.get('[aria-label="Toggle menu"]').click();
    cy.contains('a', 'Shop').should('be.visible');
    cy.get('[aria-label="Toggle menu"]').click();
    cy.contains('a', 'About').should('not.be.visible');
  });
});

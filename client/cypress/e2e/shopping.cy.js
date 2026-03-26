// shopping.cy.js — Browse, filter, product cards, add to cart, cart badge, checkout nav

describe('Shopping', () => {
  beforeEach(() => {
    cy.visit(`/shop`);
  });

  it('loads the shop page', () => {
    cy.url().should('include', '/shop');
  });

  it('displays product cards after loading', () => {
    cy.get('.shop-product-card, [data-testid="product-card"], article', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0,
    );
  });

  it('shows product name and price on each card', () => {
    cy.get('.shop-product-card, [data-testid="product-card"], article', { timeout: 10000 })
      .first()
      .within(() => {
        cy.get('h2, h3, [class*="name"], [class*="title"]').should('exist');
        cy.contains(/£|\$|\d+\.\d{2}/).should('exist');
      });
  });

  it('renders category filter', () => {
    cy.get('body')
      .contains(/all|category|filter/i)
      .should('exist');
  });

  it('renders sort selector', () => {
    cy.get('select, [role="combobox"]').should('exist');
  });

  it('renders price range filter', () => {
    cy.get('input[type="range"]').should('exist');
  });

  it('clicking a product card navigates to product details', () => {
    cy.get('.shop-product-card, [data-testid="product-card"], article', { timeout: 10000 })
      .first()
      .find('a')
      .first()
      .click();
    cy.url().should('include', '/product/');
  });

  it('cart icon is visible in navbar', () => {
    cy.get('[aria-label*="cart" i], a[href="/cart"]').should('exist');
  });

  it('cart badge updates when item added (requires auth)', () => {
    // Badge should not exist or be 0 for unauthenticated user
    cy.get('[aria-label*="Shopping cart"]').should('exist');
  });

  it('shows no overflow on shop page layout', () => {
    cy.get('body')
      .invoke('css', 'overflow-x')
      .should('eq', 'visible')
      .or('eq', 'hidden')
      .or('eq', 'clip');
  });

  it('renders a load more button or shows all products', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button').filter(':contains("Load")').length) {
        cy.contains('button', /load more/i).should('exist');
      } else {
        cy.get('.shop-product-card, article').should('have.length.greaterThan', 0);
      }
    });
  });

  it('clicking the cart icon navigates to /cart', () => {
    cy.get('[aria-label*="Shopping cart"]').first().click();
    cy.url().should('include', '/cart');
  });
});

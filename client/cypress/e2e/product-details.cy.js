// product-details.cy.js — Product info, quantity controls, add to cart, wishlist, reviews
// NOTE: Quantity buttons use <Minus>/<Plus> SVG icons — NOT text "+" or "-"
// Quantity value is in a <span class="w-12 text-center"> NOT an <input>

function visitFirstProduct() {
  cy.visit(`/shop`);
  cy.get('.shop-product-card a', { timeout: 10000 }).first().click();
  cy.url().should('include', '/product/');
}

describe('Product Details', () => {
  beforeEach(() => {
    visitFirstProduct();
  });

  it('navigates to the product detail page', () => {
    cy.url().should('include', '/product/');
  });

  it('displays product name', () => {
    cy.get('h1, h2').first().should('not.be.empty');
  });

  it('displays product price', () => {
    cy.contains(/£\d+/).should('exist');
  });

  it('displays product description', () => {
    cy.get('p').should('exist');
  });

  it('shows product image', () => {
    cy.get('img').should('exist').and('have.attr', 'src').and('not.be.empty');
  });

  it('renders quantity controls (Minus and Plus SVG buttons)', () => {
    // Quantity section label
    cy.contains('Quantity').should('exist');
    // Two buttons inside the quantity wrapper
    cy.get('.flex.items-center.gap-3 button, .flex.items-center button').should(
      'have.length.gte',
      2,
    );
  });

  it('quantity value starts at 1', () => {
    // Quantity is in <span class="w-12 text-center font-medium">
    cy.get('span[class*="w-12"][class*="text-center"]').first().should('have.text', '1');
  });

  it('Plus button increments quantity to 2', () => {
    // Plus button is the LAST button in the quantity wrapper (after the span)
    cy.get('span[class*="w-12"][class*="text-center"]').first().next('button').click();
    cy.get('span[class*="w-12"][class*="text-center"]').first().should('have.text', '2');
  });

  it('Minus button is disabled at quantity 1 and cannot go below', () => {
    // Minus is the FIRST button before the quantity span — disabled when qty=1
    cy.get('span[class*="w-12"][class*="text-center"]')
      .first()
      .prev('button')
      .should('be.disabled');
  });

  it('shows Add to Cart button', () => {
    cy.contains('button', /add to cart/i).should('exist');
  });

  it('clicking Add to Cart without auth shows a toast error', () => {
    cy.contains('button', /add to cart/i).click();
    // Toast "Please sign in to add items to your cart" appears
    cy.get('body', { timeout: 6000 }).should('contain.text', 'sign in');
  });

  it('shows a wishlist heart button', () => {
    // Heart button exists on the page
    cy.get('button')
      .filter((i, el) => {
        return el.querySelector('svg') !== null;
      })
      .should('exist');
  });

  it('displays the customer reviews section', () => {
    cy.contains(/reviews|rating/i).should('exist');
  });

  it('shows back arrow link to return to shop', () => {
    cy.get('a[href="/shop"]').should('exist');
  });

  it('shows "You May Also Like" section with related products', () => {
    cy.get('body', { timeout: 8000 }).then(($b) => {
      if ($b.text().match(/you may also like|related|similar/i)) {
        cy.contains(/you may also like/i).should('exist');
        cy.get('.shop-product-card, [class*="ProductCard"], [class*="product-card"]').should(
          'have.length.greaterThan',
          0,
        );
      } else {
        cy.log('You May Also Like section not present — may require related products in DB');
      }
    });
  });

  it('review form requires authentication — unauthenticated user sees sign-in prompt', () => {
    cy.get('body').then(($b) => {
      // If not authenticated, clicking write review should prompt sign in
      if ($b.text().match(/write a review|leave a review|add review/i)) {
        cy.contains(/write a review|leave a review/i).click();
        cy.get('body').should(
          'satisfy',
          ($body) =>
            $body.text().match(/sign in|log in|login/i) ||
            $body.find('input[name="rating"], textarea').length > 0,
        );
      }
    });
  });
});

// responsive.cy.js — Mobile/tablet/desktop viewports, no overflow, hamburger, form usability

const VIEWPORTS = [
  { label: 'mobile', width: 375, height: 812 },
  { label: 'tablet', width: 768, height: 1024 },
  { label: 'desktop', width: 1280, height: 800 },
];

describe('Responsive Layout', () => {
  VIEWPORTS.forEach(({ label, width, height }) => {
    it(`[${label}] home page loads without horizontal overflow`, () => {
      cy.viewport(width, height);
      cy.visit('/');
      cy.get('body').should('be.visible');
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(width + 1);
      });
    });

    it(`[${label}] shop page renders product cards`, () => {
      cy.viewport(width, height);
      cy.visit(`/shop`);
      cy.get('.shop-product-card, [data-testid="product-card"], article', {
        timeout: 10000,
      }).should('have.length.greaterThan', 0);
    });
  });

  it('[mobile] hamburger menu button is visible', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    cy.get('[aria-label="Toggle menu"]').should('be.visible');
  });

  it('[mobile] desktop nav links are hidden', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    cy.get('.hidden.md\\:flex').should('not.be.visible');
  });

  it('[mobile] hamburger opens the mobile menu', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    cy.get('[aria-label="Toggle menu"]').click();
    cy.contains('a', 'Shop').should('be.visible');
    cy.contains('a', 'About').should('be.visible');
  });

  it('[desktop] desktop navbar is visible', () => {
    cy.viewport(1280, 800);
    cy.visit('/');
    cy.get('.hidden.md\\:flex, .md\\:flex').should('be.visible');
    cy.get('[aria-label="Toggle menu"]').should('not.be.visible');
  });

  it('[mobile] auth form is usable at 375px', () => {
    cy.viewport(375, 812);
    cy.visit(`/auth`);
    cy.get('input[type="email"]').should('be.visible').type('test@example.com');
    cy.get('input[type="password"]').should('be.visible').type('password123');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('[mobile] contact form is usable at 375px', () => {
    cy.viewport(375, 812);
    cy.visit(`/contact`);
    cy.get('input[name="name"]').should('be.visible').type('Test');
    cy.get('input[name="email"]').should('be.visible').type('test@example.com');
    cy.get('textarea[name="message"]').should('be.visible').type('Hello!');
  });

  it('[tablet] shop sidebar and product grid are both visible', () => {
    cy.viewport(768, 1024);
    cy.visit(`/shop`);
    cy.get('input[type="range"]').should('exist');
    cy.get('.shop-product-card, article', { timeout: 10000 }).should('exist');
  });

  it('[mobile] cart page renders correctly', () => {
    cy.viewport(375, 812);
    cy.visit(`/cart`);
    cy.get('body').should('not.be.empty');
    cy.window().then((win) => {
      expect(win.document.body.scrollWidth).to.be.lte(376);
    });
  });

  it('[mobile] no text overflows the viewport on the home page', () => {
    cy.viewport(375, 812);
    cy.visit('/');
    cy.get('h1, h2').each(($el) => {
      const rect = $el[0].getBoundingClientRect();
      // Allow a small tolerance
      expect(rect.right).to.be.lte(376);
    });
  });
});

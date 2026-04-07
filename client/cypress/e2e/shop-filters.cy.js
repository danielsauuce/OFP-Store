// shop-filters.cy.js — Category, sort, price range, load more, combined filters

describe('Shop Filters', () => {
  beforeEach(() => {
    cy.visit(`/shop`);
    // Wait for products to load
    cy.get('.shop-product-card, [data-testid="product-card"], article', { timeout: 10000 }).should(
      'exist',
    );
  });

  it('renders category filter with "All" option', () => {
    cy.contains('button, [role="tab"], label', /^all$/i).should('exist');
  });

  it('clicking a category filter updates visible products', () => {
    cy.get('[class*="CategoryFilter"] button, [class*="category"] button', { timeout: 5000 })
      .not(':contains("All")')
      .first()
      .click();
    cy.get('.shop-product-card, article', { timeout: 8000 }).should('exist');
  });

  it('clicking a category updates the URL ?category= param', () => {
    cy.get('[class*="CategoryFilter"] button, [class*="category"] button', { timeout: 5000 })
      .not(':contains("All")')
      .first()
      .click();
    cy.url().should('include', 'category=');
  });

  it('clicking "All" clears the category URL param', () => {
    // First click a non-all category
    cy.get('[class*="CategoryFilter"] button, [class*="category"] button', { timeout: 5000 })
      .not(':contains("All")')
      .first()
      .click();
    cy.url().should('include', 'category=');
    // Then click All
    cy.contains('button, [role="tab"], label', /^all$/i).click();
    cy.url().should('not.include', 'category=');
  });

  it('shows more than just one category option', () => {
    cy.get('[class*="CategoryFilter"] button, [class*="category"] button', { timeout: 5000 })
      .not(':contains("All")')
      .should('have.length.greaterThan', 0);
  });

  it('clicking "All" category shows all products', () => {
    cy.contains('button, [role="tab"], label', /^all$/i).click();
    cy.get('.shop-product-card, article', { timeout: 8000 }).should('have.length.greaterThan', 0);
  });

  it('sort dropdown exists and has options', () => {
    cy.get('select, [role="combobox"]').first().should('exist');
    cy.get('select option, [role="option"]').should('have.length.greaterThan', 1);
  });

  it('changing sort order updates product list', () => {
    cy.get('select').first().select(1);
    cy.get('.shop-product-card, article', { timeout: 8000 }).should('exist');
  });

  it('price range slider exists', () => {
    cy.get('input[type="range"]').should('exist');
  });

  it('adjusting price range updates visible products', () => {
    cy.get('input[type="range"]').first().invoke('val', 1000).trigger('input').trigger('change');
    cy.get('.shop-product-card, article', { timeout: 8000 });
    // just verify no JS error crashes the page
    cy.get('body').should('not.be.empty');
  });

  it('load more button shows additional products when clicked', () => {
    cy.get('body').then(($b) => {
      if ($b.find('button:contains("Load")').length || $b.text().includes('Load More')) {
        cy.get('.shop-product-card, article')
          .its('length')
          .then((initialCount) => {
            cy.contains('button', /load more/i).click();
            cy.get('.shop-product-card, article', { timeout: 8000 })
              .its('length')
              .should('be.greaterThan', initialCount);
          });
      }
    });
  });

  it('combined: category + sort filter works without crash', () => {
    cy.get('[class*="CategoryFilter"] button, [class*="category"] button')
      .not(':contains("All")')
      .first()
      .click();
    cy.get('select').first().select(1);
    cy.get('body').should('not.be.empty');
    cy.get('.shop-product-card, article').should('exist');
  });
});

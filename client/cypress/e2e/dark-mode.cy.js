// dark-mode.cy.js — Theme toggle, localStorage persistence, survives navigation and reload

describe('Dark Mode', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('theme toggle button is visible in the navbar', () => {
    cy.get(
      '[aria-label*="Switch to" i], [aria-label*="mode" i], [aria-label*="dark" i], [aria-label*="light" i]',
    ).should('exist');
  });

  it('clicking the theme toggle changes the theme', () => {
    // Capture whether dark is currently applied
    cy.get('html').then(($html) => {
      const wasDark = ($html.attr('class') || '').includes('dark');
      cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
      if (wasDark) {
        cy.get('html').invoke('attr', 'class').should('not.include', 'dark');
      } else {
        cy.get('html').invoke('attr', 'class').should('include', 'dark');
      }
    });
  });

  it('dark mode persists in localStorage after toggle', () => {
    cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
    cy.window().then((win) => {
      const stored =
        win.localStorage.getItem('theme') ||
        win.localStorage.getItem('color-theme') ||
        win.localStorage.getItem('darkMode');
      expect(stored).to.not.be.null;
    });
  });

  it('theme is restored from localStorage on page reload', () => {
    // set dark mode
    cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
    cy.get('html')
      .invoke('attr', 'class')
      .then((cls) => {
        const isDark = cls && cls.includes('dark');
        cy.reload();
        if (isDark) {
          cy.get('html').invoke('attr', 'class').should('include', 'dark');
        } else {
          cy.get('html').invoke('attr', 'class').should('not.include', 'dark');
        }
      });
  });

  it('toggling twice returns to original theme', () => {
    cy.get('html').then(($html) => {
      const wasDark = ($html.attr('class') || '').includes('dark');
      cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
      cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
      if (wasDark) {
        cy.get('html').invoke('attr', 'class').should('include', 'dark');
      } else {
        cy.get('html').invoke('attr', 'class').should('not.include', 'dark');
      }
    });
  });

  it('theme persists when navigating to /shop', () => {
    cy.get('[aria-label*="Switch to" i], [aria-label*="mode" i]').first().click();
    cy.get('html')
      .invoke('attr', 'class')
      .then((cls) => {
        const currentTheme = cls;
        cy.contains('a', 'Shop').click();
        cy.url().should('include', '/shop');
        cy.get('html').invoke('attr', 'class').should('eq', currentTheme);
      });
  });

  it('mobile theme toggle works and persists', () => {
    cy.viewport('iphone-6');
    cy.visit('/');
    cy.get('[aria-label="Toggle menu"]').click();
    cy.contains('button', /light mode|dark mode/i).click();
    cy.window().then((win) => {
      const stored =
        win.localStorage.getItem('theme') ||
        win.localStorage.getItem('color-theme') ||
        win.localStorage.getItem('darkMode');
      expect(stored).to.not.be.null;
    });
  });
});

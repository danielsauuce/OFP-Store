// profile.cy.js — All 6 profile tabs: info, orders, addresses, wishlist, security, danger zone

function loginAsUser() {
  const email = Cypress.env('USER_EMAIL');
  const password = Cypress.env('USER_PASSWORD');
  if (!email || !password) return false;
  cy.visit(`/auth`);
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url({ timeout: 10000 }).should('not.include', '/auth');
  return true;
}

describe('Profile — Unauthenticated', () => {
  it('redirects unauthenticated user to /auth', () => {
    cy.visit(`/profile`);
    cy.url().should('include', '/auth');
  });
});

describe('Profile — Tabs (requires user session)', () => {
  beforeEach(() => {
    const ok = loginAsUser();
    if (ok) cy.visit(`/profile`);
  });

  it('shows the Profile tab by default', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Profile').should('exist');
  });

  it('renders all 6 tab buttons', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    const tabs = ['Profile', 'Orders', 'Addresses', 'Wishlist', 'Security', 'Account'];
    tabs.forEach((tab) => cy.contains('button, [role="tab"]', tab).should('exist'));
  });

  it('Profile tab — shows full name and email fields', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Profile').click();
    cy.get('input[name="fullName"], input[placeholder*="name" i]').should('exist');
    cy.get('input[name="email"], input[type="email"]').should('exist');
  });

  it('Profile tab — Save button exists', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Profile').click();
    cy.contains('button', /save/i).should('exist');
  });

  it('Orders tab — renders order history section', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Orders').click();
    cy.get('body')
      .should('contain.text', 'Order')
      .or('contain.text', 'order')
      .or('contain.text', 'No orders');
  });

  it('Addresses tab — renders add address option', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Addresses').click();
    cy.contains('button, a', /add address|new address|\+/i).should('exist');
  });

  it('Addresses tab — add address form has required fields', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Addresses').click();
    cy.contains('button, a', /add address|new address|\+/i).click();
    cy.get('input[name="street"], input[placeholder*="street" i]').should('exist');
    cy.get('input[name="city"], input[placeholder*="city" i]').should('exist');
  });

  it('Wishlist tab — renders wishlist section', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Wishlist').click();
    cy.get('body')
      .should('contain.text', 'Wishlist')
      .or('contain.text', 'wishlist')
      .or('contain.text', 'No items');
  });

  it('Security tab — shows change password fields', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Security').click();
    cy.get('input[type="password"]').should('have.length.greaterThan', 0);
  });

  it('Security tab — has update password button', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Security').click();
    cy.contains('button', /update|change|save/i).should('exist');
  });

  it('Danger Zone tab — shows deactivate / delete option', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Account').click();
    cy.get('body')
      .should('contain.text', 'deactivate')
      .or('contain.text', 'delete')
      .or('contain.text', 'Danger');
  });

  it('Danger Zone tab — shows a confirmation modal or warning', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Account').click();
    cy.contains('button', /deactivate|delete account/i).click();
    // Modal is a plain div with fixed+z-50 classes (no role="dialog")
    cy.get('[class*="fixed"][class*="z-50"], [class*="inset-0"]', { timeout: 5000 }).should(
      'exist',
    );
  });

  it('profile avatar upload element exists', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Profile').click();
    cy.get(
      'input[type="file"], [aria-label*="upload" i], [aria-label*="avatar" i], [aria-label*="photo" i]',
    ).should('exist');
  });

  it('phone input exists on Profile tab', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Profile').click();
    cy.get('input[name="phone"], input[type="tel"]').should('exist');
  });

  it('order status badge is visible if orders exist', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Orders').click();
    cy.get('body').then(($b) => {
      if (!$b.text().includes('No orders')) {
        cy.get('[class*="badge"], [class*="status"]').should('exist');
      }
    });
  });

  it('wishlist items link to product detail pages', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Wishlist').click();
    cy.get('body').then(($b) => {
      if (!$b.text().includes('No items')) {
        cy.get('a[href*="/product/"]').should('exist');
      }
    });
  });

  it('remove from wishlist button exists on wishlist items', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Wishlist').click();
    cy.get('body').then(($b) => {
      if (!$b.text().includes('No items')) {
        cy.get(
          'button[aria-label*="remove" i], button[title*="remove" i], [class*="remove"]',
        ).should('exist');
      }
    });
  });

  it('Security tab — shows current password field', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Security').click();
    cy.get('input[name="currentPassword"], input[placeholder*="current" i]').should('exist');
  });

  it('Security tab — new password mismatch shows error', () => {
    if (!Cypress.env('USER_EMAIL')) return;
    cy.contains('button, [role="tab"]', 'Security').click();
    cy.get('input[name="currentPassword"]').type('anypassword');
    cy.get('input[name="newPassword"]').type('NewPassword1!');
    cy.get('input[name="confirmPassword"]').type('DifferentPassword1!');
    cy.contains('button', /update|change|save/i).click();
    cy.get('body', { timeout: 6000 }).should('contain.text', 'match').or('contain.text', 'confirm');
  });
});

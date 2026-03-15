/**
 * E2E test configuration.
 *
 * Tests run against the production site by default.
 * Set BASE_URL=http://localhost:5173 to test locally.
 */
export const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://chorechamp-prod.onrender.com',
  householdId: '107444e7-44e1-4ce7-bf93-f76bd1470d2a',
  accounts: {
    parent: {
      email: 'danher2525@gmail.com',
      password: 'ChoreChamp2026!',
      name: 'Daniel',
    },
    parent2: {
      email: 'christina.hernandez@chorechamp.app',
      password: 'ChoreChamp2026!',
      name: 'Christina',
    },
    teen: {
      email: 'adam.hernandez@chorechamp.app',
      password: 'AdamChores2026!',
      name: 'Adam',
    },
    child: {
      email: 'addison.hernandez@chorechamp.app',
      password: 'AddisonChores2026!',
      name: 'Addison',
    },
  },
};

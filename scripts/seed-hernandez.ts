/**
 * Seed script for the Hernandez family household.
 *
 * Usage:
 *   node --import tsx scripts/seed-hernandez.ts
 *
 * Requires the API to be running. Uses the live API to create
 * accounts and seed data via authenticated endpoints.
 */

const API_URL = process.env.API_URL || 'https://chorechamp-api-u0o9.onrender.com';
const ORIGIN = 'https://chorechamp-prod.onrender.com';

// ── Helpers ─────────────────────────────────────────────────────────

// Store session cookies from auth responses
let sessionCookies = '';

function extractCookies(res: Response): string {
  const cookies: string[] = [];
  // getSetCookie() returns all Set-Cookie headers
  const setCookieHeaders = res.headers.getSetCookie?.() || [];
  for (const header of setCookieHeaders) {
    // Extract just the name=value part (before the first ;)
    const nameValue = header.split(';')[0];
    if (nameValue) cookies.push(nameValue);
  }
  // Fallback: try raw header
  if (cookies.length === 0) {
    const raw = res.headers.get('set-cookie');
    if (raw) {
      // Split on comma but only when followed by a cookie name pattern
      const parts = raw.split(/,\s*(?=[a-zA-Z_]+=)/);
      for (const part of parts) {
        const nameValue = part.split(';')[0].trim();
        if (nameValue) cookies.push(nameValue);
      }
    }
  }
  return cookies.join('; ');
}

async function api<T = unknown>(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Origin': ORIGIN,
  };
  if (sessionCookies) {
    headers['Cookie'] = sessionCookies;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    redirect: 'manual',
  });

  // Capture any new cookies
  const newCookies = extractCookies(res);
  if (newCookies) sessionCookies = newCookies;

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API ${res.status} ${endpoint}: ${text}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}

async function signup(email: string, password: string, name: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({ email, password, name }),
    redirect: 'manual',
  });

  const cookies = extractCookies(res);
  const text = await res.text();

  if (!res.ok && res.status !== 302) {
    // If user already exists, try signing in
    if (res.status === 422 || text.includes('already') || text.includes('exists')) {
      return signin(email, password);
    }
    throw new Error(`Signup failed ${res.status}: ${text}`);
  }

  if (cookies) sessionCookies = cookies;
  const data = text ? JSON.parse(text) : {};
  return data.user?.id || data.id || '';
}

async function signin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({ email, password }),
    redirect: 'manual',
  });

  const cookies = extractCookies(res);
  const text = await res.text();

  if (!res.ok && res.status !== 302) {
    throw new Error(`Signin failed ${res.status}: ${text}`);
  }

  if (cookies) sessionCookies = cookies;
  const data = text ? JSON.parse(text) : {};
  return data.user?.id || data.id || '';
}

// ── Family Data ─────────────────────────────────────────────────────

const DANIEL_EMAIL = 'danher2525@gmail.com';
const DANIEL_PASSWORD = 'ChoreChamp2026!';

const CHILD_MEMBERS = [
  { name: 'Christina', role: 'parent' as const, color: '#EC4899', birthYear: 1998 },
  { name: 'Adam', role: 'teen' as const, color: '#10B981', birthYear: 2014 },
  { name: 'Addison', role: 'child' as const, color: '#F59E0B', birthYear: 2018 },
  { name: 'Aiden', role: 'child' as const, color: '#8B5CF6', birthYear: 2023 },
  // Dalton omitted: 18 years old, free plan supports 5 members max
];

const DAILY_CHORES = [
  { title: 'Do the dishes', category: 'kitchen', icon: '🍽️', pointValue: 15, difficulty: 'medium' as const, recurrenceType: 'daily' as const, estimatedMinutes: 20, steps: ['Rinse all dishes', 'Load dishwasher', 'Hand wash large items', 'Wipe down sink'] },
  { title: 'Wipe counters and stovetop', category: 'kitchen', icon: '🧽', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 10 },
  { title: 'Take out trash and recycling', category: 'kitchen', icon: '🗑️', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 5 },
  { title: 'Sweep kitchen floor', category: 'kitchen', icon: '🧹', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 10 },
  { title: 'Feed and water chickens', category: 'animals', icon: '🐔', pointValue: 15, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 10, steps: ['Check water levels', 'Fill feeders', 'Collect eggs', 'Check coop'] },
  { title: 'Feed and walk dogs', category: 'animals', icon: '🐕', pointValue: 15, difficulty: 'medium' as const, recurrenceType: 'daily' as const, estimatedMinutes: 20, steps: ['Fill food bowls', 'Fill water bowls', 'Walk dogs around block'] },
  { title: 'Tidy living room', category: 'living', icon: '🛋️', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 10, steps: ['Pick up toys/items', 'Straighten pillows', 'Quick vacuum if needed'] },
  { title: 'Clear and wipe dining table', category: 'dining', icon: '🪑', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 10 },
  { title: 'Tidy hallway and stairs', category: 'general', icon: '🏠', pointValue: 5, difficulty: 'trivial' as const, recurrenceType: 'daily' as const, estimatedMinutes: 5 },
  { title: 'Wipe bathroom sink and counter', category: 'bathroom', icon: '🚿', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 5 },
  { title: 'Start a load of laundry', category: 'laundry', icon: '👕', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'daily' as const, estimatedMinutes: 5 },
  { title: 'Fold and put away laundry', category: 'laundry', icon: '🧺', pointValue: 15, difficulty: 'medium' as const, recurrenceType: 'daily' as const, estimatedMinutes: 20 },
  { title: 'Make your bed', category: 'bedroom', icon: '🛏️', pointValue: 5, difficulty: 'trivial' as const, recurrenceType: 'daily' as const, estimatedMinutes: 3 },
];

const WEEKLY_CHORES = [
  { title: 'Mow the lawn', category: 'outdoor', icon: '🌿', pointValue: 30, difficulty: 'hard' as const, recurrenceType: 'weekly' as const, recurrenceDays: [6], estimatedMinutes: 45 },
  { title: 'Vacuum entire house', category: 'general', icon: '🧹', pointValue: 25, difficulty: 'medium' as const, recurrenceType: 'weekly' as const, recurrenceDays: [6], estimatedMinutes: 30 },
  { title: 'Mop hard floors', category: 'general', icon: '🪣', pointValue: 20, difficulty: 'medium' as const, recurrenceType: 'weekly' as const, recurrenceDays: [6], estimatedMinutes: 25 },
  { title: 'Clean all bathrooms', category: 'bathroom', icon: '🚽', pointValue: 25, difficulty: 'hard' as const, recurrenceType: 'weekly' as const, recurrenceDays: [6], estimatedMinutes: 30, steps: ['Scrub toilets', 'Clean mirrors', 'Wipe counters', 'Scrub shower/tub', 'Mop floor'] },
  { title: 'Grocery shopping list', category: 'general', icon: '📝', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'weekly' as const, recurrenceDays: [0], estimatedMinutes: 15 },
  { title: 'Meal prep for the week', category: 'kitchen', icon: '🥗', pointValue: 30, difficulty: 'hard' as const, recurrenceType: 'weekly' as const, recurrenceDays: [0], estimatedMinutes: 60 },
  { title: 'Water indoor plants', category: 'general', icon: '🪴', pointValue: 5, difficulty: 'trivial' as const, recurrenceType: 'weekly' as const, recurrenceDays: [3], estimatedMinutes: 10 },
  { title: 'Wipe down all door handles', category: 'general', icon: '🚪', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'weekly' as const, recurrenceDays: [3], estimatedMinutes: 10 },
];

const DEEP_CLEAN_CHORES = [
  { title: 'Deep clean: Living Room', category: 'deep-clean', icon: '✨', pointValue: 50, difficulty: 'epic' as const, recurrenceType: 'custom' as const, recurrenceInterval: 35, estimatedMinutes: 90, steps: ['Move furniture and vacuum underneath', 'Clean windows inside and out', 'Dust all surfaces, shelves, baseboards', 'Clean light fixtures', 'Shampoo carpet or mop'] },
  { title: 'Deep clean: Kitchen', category: 'deep-clean', icon: '✨', pointValue: 50, difficulty: 'epic' as const, recurrenceType: 'custom' as const, recurrenceInterval: 35, estimatedMinutes: 90, steps: ['Clean inside oven', 'Clean inside fridge', 'Degrease range hood', 'Scrub grout', 'Clean behind appliances'] },
  { title: 'Deep clean: Dining Room', category: 'deep-clean', icon: '✨', pointValue: 40, difficulty: 'hard' as const, recurrenceType: 'custom' as const, recurrenceInterval: 35, estimatedMinutes: 60, steps: ['Polish table and chairs', 'Clean light fixture', 'Wash windows', 'Vacuum/mop corners'] },
  { title: 'Deep clean: Bathrooms', category: 'deep-clean', icon: '✨', pointValue: 50, difficulty: 'epic' as const, recurrenceType: 'custom' as const, recurrenceInterval: 35, estimatedMinutes: 90, steps: ['Descale showerheads', 'Scrub tile grout', 'Clean exhaust fan', 'Organize under sink', 'Replace liners'] },
  { title: 'Deep clean: Hallway and Stairs', category: 'deep-clean', icon: '✨', pointValue: 30, difficulty: 'medium' as const, recurrenceType: 'custom' as const, recurrenceInterval: 35, estimatedMinutes: 45, steps: ['Vacuum stairs thoroughly', 'Dust railings and banisters', 'Clean light fixtures', 'Wash walls and baseboards'] },
];

const HOME_REPAIR_CHORES = [
  { title: 'Fix leaky kitchen faucet', category: 'repairs', icon: '🔧', pointValue: 40, difficulty: 'hard' as const, recurrenceType: 'once' as const, estimatedMinutes: 60 },
  { title: 'Patch drywall holes in hallway', category: 'repairs', icon: '🪚', pointValue: 30, difficulty: 'medium' as const, recurrenceType: 'once' as const, estimatedMinutes: 45 },
  { title: 'Fix running toilet upstairs', category: 'repairs', icon: '🚽', pointValue: 30, difficulty: 'medium' as const, recurrenceType: 'once' as const, estimatedMinutes: 30 },
  { title: 'Replace weather stripping on front door', category: 'repairs', icon: '🚪', pointValue: 20, difficulty: 'easy' as const, recurrenceType: 'once' as const, estimatedMinutes: 30 },
  { title: 'Fix squeaky door hinges', category: 'repairs', icon: '🔧', pointValue: 10, difficulty: 'easy' as const, recurrenceType: 'once' as const, estimatedMinutes: 15 },
  { title: 'Clean gutters', category: 'outdoor', icon: '🏡', pointValue: 40, difficulty: 'hard' as const, recurrenceType: 'once' as const, estimatedMinutes: 60 },
  { title: 'Caulk around bathtub', category: 'repairs', icon: '🛁', pointValue: 25, difficulty: 'medium' as const, recurrenceType: 'once' as const, estimatedMinutes: 30 },
  { title: 'Touch up paint in kids rooms', category: 'repairs', icon: '🎨', pointValue: 30, difficulty: 'medium' as const, recurrenceType: 'once' as const, estimatedMinutes: 60 },
  { title: 'Fix backyard fence gate latch', category: 'outdoor', icon: '🏡', pointValue: 25, difficulty: 'medium' as const, recurrenceType: 'once' as const, estimatedMinutes: 30 },
  { title: 'Replace smoke detector batteries', category: 'safety', icon: '🔋', pointValue: 15, difficulty: 'easy' as const, recurrenceType: 'once' as const, estimatedMinutes: 15 },
];

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding Hernandez family data via ${API_URL}\n`);

  // 1. Create Daniel's account
  console.log('1. Creating Daniel\'s account...');
  const userId = await signup(DANIEL_EMAIL, DANIEL_PASSWORD, 'Daniel');
  console.log(`   User ID: ${userId}`);
  console.log(`   Session cookies: ${sessionCookies ? 'captured' : 'NONE'}\n`);

  if (!sessionCookies) {
    throw new Error('No session cookies received. Cannot proceed.');
  }

  // 2. Create household
  console.log('2. Creating Hernandez household...');
  const householdRes = await api<{ household: { id: string }; member: { id: string } }>('/api/households', {
    method: 'POST',
    body: {
      name: 'Hernandez Family',
      timezone: 'America/New_York',
      weekStartsOn: 0,
      pointsName: 'Stars',
    },
  });
  const householdId = householdRes.household.id;
  const danielMemberId = householdRes.member.id;
  console.log(`   Household ID: ${householdId}`);
  console.log(`   Daniel's member ID: ${danielMemberId}\n`);

  // 3. Add family members
  console.log('3. Adding family members...');
  const memberIds: Record<string, string> = { Daniel: danielMemberId };

  for (const child of CHILD_MEMBERS) {
    const member = await api<{ id: string }>(`/api/${householdId}/members`, {
      method: 'POST',
      body: child,
    });
    memberIds[child.name] = member.id;
    console.log(`   ${child.name} (${child.role}): ${member.id}`);
  }
  console.log();

  // 4. Create chores
  console.log('4. Creating chores...');
  let choreCount = 0;

  const allUnassigned = [...DAILY_CHORES, ...WEEKLY_CHORES, ...DEEP_CLEAN_CHORES, ...HOME_REPAIR_CHORES];
  for (const chore of allUnassigned) {
    await api(`/api/${householdId}/chores`, {
      method: 'POST',
      body: { ...chore, assignedTo: [], assignmentType: 'anyone' },
    });
    choreCount++;
    if (choreCount % 10 === 0) console.log(`   ${choreCount} chores created...`);
  }
  console.log(`   ${choreCount} general chores created`);

  // 5. Assign specific chores to specific kids
  console.log('\n5. Creating assigned chores...');
  const assignedChores = [
    { title: 'Feed and water chickens (morning)', category: 'animals', icon: '🐔', pointValue: 15, difficulty: 'easy', recurrenceType: 'daily', estimatedMinutes: 10, assignedTo: [memberIds['Addison']], assignmentType: 'specific', dueTime: '07:00' },
    { title: 'Clear dining table after dinner', category: 'dining', icon: '🍽️', pointValue: 10, difficulty: 'easy', recurrenceType: 'daily', estimatedMinutes: 5, assignedTo: [memberIds['Adam']], assignmentType: 'specific', dueTime: '19:00' },
    { title: 'Set the table for dinner', category: 'dining', icon: '🍴', pointValue: 10, difficulty: 'easy', recurrenceType: 'daily', estimatedMinutes: 5, assignedTo: [memberIds['Addison']], assignmentType: 'specific', dueTime: '17:30' },
    { title: 'Take out trash cans (trash day)', category: 'outdoor', icon: '🗑️', pointValue: 15, difficulty: 'easy', recurrenceType: 'weekly', recurrenceDays: [2], estimatedMinutes: 10, assignedTo: [memberIds['Adam']], assignmentType: 'specific' },
    { title: 'Clean your room', category: 'bedroom', icon: '🛏️', pointValue: 20, difficulty: 'medium', recurrenceType: 'weekly', recurrenceDays: [6], estimatedMinutes: 20, assignedTo: [memberIds['Adam'], memberIds['Addison']], assignmentType: 'specific' },
    { title: 'Help with yard work', category: 'outdoor', icon: '🌿', pointValue: 25, difficulty: 'medium', recurrenceType: 'weekly', recurrenceDays: [6], estimatedMinutes: 30, assignedTo: [memberIds['Adam']], assignmentType: 'specific' },
    { title: 'Empty dishwasher', category: 'kitchen', icon: '🍽️', pointValue: 10, difficulty: 'easy', recurrenceType: 'daily', estimatedMinutes: 10, assignedTo: [memberIds['Adam'], memberIds['Addison']], assignmentType: 'rotating' },
  ];

  for (const chore of assignedChores) {
    await api(`/api/${householdId}/chores`, {
      method: 'POST',
      body: chore,
    });
    choreCount++;
  }
  console.log(`   ${assignedChores.length} assigned chores created`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('SEED COMPLETE');
  console.log('='.repeat(50));
  console.log(`Household: Hernandez Family (${householdId})`);
  console.log(`Members: ${Object.keys(memberIds).length} (${Object.keys(memberIds).join(', ')})`);
  console.log(`Chores: ${choreCount} total`);
  console.log(`\nLogin credentials:`);
  console.log(`  Email: ${DANIEL_EMAIL}`);
  console.log(`  Password: ${DANIEL_PASSWORD}`);
  console.log(`\nProd site: https://chorechamp-prod.onrender.com`);
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});

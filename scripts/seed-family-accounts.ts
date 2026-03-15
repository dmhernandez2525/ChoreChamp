/**
 * Seed script to create user accounts for all Hernandez family members
 * and link them to existing member profiles in the household.
 *
 * Also adds Dalton as a new member (premium allows unlimited members).
 *
 * Usage:
 *   cd apps/api && npx tsx ../../scripts/seed-family-accounts.ts
 */

const API_URL = process.env.API_URL || 'https://chorechamp-api-u0o9.onrender.com';
const ADMIN_SECRET = '7275426a646bef13b881e7bf9ddeba4840035d54c556119ab762373f388c5f02';
const HOUSEHOLD_ID = '107444e7-44e1-4ce7-bf93-f76bd1470d2a';

// Family accounts to create
const FAMILY_ACCOUNTS = [
  {
    name: 'Christina',
    email: 'christina.hernandez@chorechamp.app',
    password: 'ChoreChamp2026!',
    role: 'parent',
  },
  {
    name: 'Adam',
    email: 'adam.hernandez@chorechamp.app',
    password: 'AdamChores2026!',
    role: 'teen',
  },
  {
    name: 'Addison',
    email: 'addison.hernandez@chorechamp.app',
    password: 'AddisonChores2026!',
    role: 'child',
  },
  {
    name: 'Aiden',
    email: 'aiden.hernandez@chorechamp.app',
    password: 'AidenChores2026!',
    role: 'child',
  },
  {
    name: 'Dalton',
    email: 'dalton.hernandez@chorechamp.app',
    password: 'DaltonChores2026!',
    role: 'teen',
  },
];

interface SignupResponse {
  token?: string;
  user?: { id: string; name: string; email: string };
  id?: string;
}

async function signupUser(
  email: string,
  password: string,
  name: string
): Promise<{ userId: string; token: string }> {
  // Try sign-up first
  const signupRes = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://chorechamp-prod.onrender.com',
    },
    body: JSON.stringify({ email, password, name }),
  });

  const signupText = await signupRes.text();

  if (signupRes.ok) {
    const data: SignupResponse = JSON.parse(signupText);
    return {
      userId: data.user?.id || data.id || '',
      token: data.token || '',
    };
  }

  // If user already exists, sign in instead
  if (
    signupRes.status === 422 ||
    signupText.includes('already') ||
    signupText.includes('exists')
  ) {
    const signinRes = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://chorechamp-prod.onrender.com',
      },
      body: JSON.stringify({ email, password }),
    });

    const signinText = await signinRes.text();
    if (!signinRes.ok) {
      throw new Error(`Sign-in failed for ${email}: ${signinRes.status} ${signinText}`);
    }

    const data: SignupResponse = JSON.parse(signinText);
    return {
      userId: data.user?.id || data.id || '',
      token: data.token || '',
    };
  }

  throw new Error(`Sign-up failed for ${email}: ${signupRes.status} ${signupText}`);
}

async function adminLinkMember(
  memberId: string,
  userId: string,
  householdId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/subscription/admin/link-member`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId, userId, householdId, secret: ADMIN_SECRET }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Link-member failed: ${res.status} ${text}`);
  }
}

async function getMembers(token: string): Promise<Array<{ id: string; name: string; userId: string | null; role: string }>> {
  const res = await fetch(`${API_URL}/api/${HOUSEHOLD_ID}/members`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Get members failed: ${res.status}`);
  }

  return res.json();
}

async function addMember(
  token: string,
  member: { name: string; role: string; color: string; birthYear: number }
): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/${HOUSEHOLD_ID}/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(member),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Add member failed: ${res.status} ${text}`);
  }

  return res.json();
}

async function main() {
  console.log('=== ChoreChamp Family Account Setup ===\n');
  console.log(`API: ${API_URL}`);
  console.log(`Household: ${HOUSEHOLD_ID}\n`);

  // Step 1: Sign in as Daniel to get a token for API calls
  console.log('1. Signing in as Daniel...');
  const daniel = await signupUser('danher2525@gmail.com', 'ChoreChamp2026!', 'Daniel');
  console.log(`   Token: ${daniel.token.substring(0, 8)}...`);

  // Step 2: Get existing members
  console.log('\n2. Fetching existing members...');
  const existingMembers = await getMembers(daniel.token);
  console.log(`   Found ${existingMembers.length} members:`);
  for (const m of existingMembers) {
    console.log(`   - ${m.name} (${m.role}) userId=${m.userId || 'NULL'}`);
  }

  // Step 3: Add Dalton if not already a member
  const daltonExists = existingMembers.find(m => m.name === 'Dalton');
  if (!daltonExists) {
    console.log('\n3. Adding Dalton as a member...');
    const dalton = await addMember(daniel.token, {
      name: 'Dalton',
      role: 'teen',
      color: '#F97316',
      birthYear: 2008,
    });
    console.log(`   Dalton member ID: ${dalton.id}`);
    existingMembers.push({ id: dalton.id, name: 'Dalton', userId: null, role: 'teen' });
  } else {
    console.log('\n3. Dalton already exists as a member.');
  }

  // Step 4: Create user accounts and link to existing members
  console.log('\n4. Creating user accounts and linking to members...\n');

  const credentials: Array<{ name: string; email: string; password: string; userId: string }> = [
    { name: 'Daniel', email: 'danher2525@gmail.com', password: 'ChoreChamp2026!', userId: daniel.userId },
  ];

  for (const account of FAMILY_ACCOUNTS) {
    // Check if this member is already linked (skip sign-in to save rate limit)
    const member = existingMembers.find(m => m.name === account.name);
    if (member?.userId) {
      console.log(`   ${account.name}: Already linked to user ${member.userId} (skipping)`);
      credentials.push({
        name: account.name,
        email: account.email,
        password: account.password,
        userId: member.userId,
      });
      continue;
    }

    // Rate limit delay between sign-ups (better-auth defaults to strict limits)
    console.log(`   Waiting 12s before creating ${account.name}'s account...`);
    await new Promise(resolve => setTimeout(resolve, 12000));
    console.log(`   Creating account for ${account.name}...`);
    const { userId, token } = await signupUser(account.email, account.password, account.name);
    console.log(`     User ID: ${userId}`);

    if (member && !member.userId) {
      console.log(`     Linking to member ${member.id}...`);
      await adminLinkMember(member.id, userId, HOUSEHOLD_ID);
      console.log(`     Linked successfully.`);
    } else if (!member) {
      console.log(`     WARNING: No matching member found for ${account.name}`);
    }

    credentials.push({
      name: account.name,
      email: account.email,
      password: account.password,
      userId,
    });
  }

  // Step 5: Verify all members are linked
  console.log('\n5. Verifying member links...');
  const updatedMembers = await getMembers(daniel.token);
  for (const m of updatedMembers) {
    const status = m.userId ? 'LINKED' : 'UNLINKED';
    console.log(`   ${status}: ${m.name} (${m.role})`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SETUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nApp URL: https://chorechamp-prod.onrender.com`);
  console.log('\nLogin Credentials:');
  console.log('-'.repeat(60));
  for (const cred of credentials) {
    console.log(`  ${cred.name.padEnd(12)} | ${cred.email.padEnd(40)} | ${cred.password}`);
  }
  console.log('-'.repeat(60));
  console.log('\nAll family members can sign in at the URL above.');
  console.log('Each person will see the shared Hernandez Family household.\n');
}

main().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});

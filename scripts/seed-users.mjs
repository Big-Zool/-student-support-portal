/**
 * Seed Script — Creates the 4 demo users via Supabase Auth signup.
 * 
 * Run this ONCE after setting up Supabase:
 *   node scripts/seed-users.mjs
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 *   - OR pass them as arguments
 * 
 * This uses the Admin API (service_role key) which bypasses email confirmation.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://vdzwjlaugsryljrjnpta.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('');
  console.error('Run like this:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-key-here node scripts/seed-users.mjs');
  console.error('');
  console.error('Find your service_role key in Supabase Dashboard → Settings → API → service_role');
  process.exit(1);
}

const SEED_USERS = [
  { email: 'student@demo.com', password: 'demo1234', full_name: 'Demo Student', role: 'student' },
  { email: 'sales1@demo.com',  password: 'demo1234', full_name: 'Alex Sales',   role: 'sales' },
  { email: 'sales2@demo.com',  password: 'demo1234', full_name: 'Aigerim Sales', role: 'sales' },
  { email: 'manager@demo.com', password: 'demo1234', full_name: 'Demo Manager', role: 'manager' },
];

async function createUser({ email, password, full_name, role }) {
  // Use Supabase Admin API to create user (bypasses email confirmation)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,  // auto-confirm the email
      user_metadata: { full_name, role },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    // If user already exists, that's fine
    if (data?.msg?.includes('already been registered') || data?.message?.includes('already been registered')) {
      console.log(`⏭️  ${email} already exists, skipping`);
      return;
    }
    console.error(`❌ Failed to create ${email}:`, data);
    return;
  }

  console.log(`✅ Created ${email} (${role}) — id: ${data.id}`);

  // The DB trigger handle_new_user should auto-create the profile.
  // But if the role is not 'student', we need to update it since the trigger defaults to 'student'.
  if (role !== 'student' && data.id) {
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ role }),
    });

    if (updateRes.ok) {
      console.log(`   ↳ Updated role to '${role}'`);
    } else {
      const err = await updateRes.text();
      console.error(`   ↳ Failed to update role: ${err}`);
    }
  }
}

console.log('🌱 Seeding demo users...\n');

for (const user of SEED_USERS) {
  await createUser(user);
}

console.log('\n🎉 Done! You can now log in with:');
console.log('   student@demo.com  / demo1234');
console.log('   sales1@demo.com   / demo1234');
console.log('   sales2@demo.com   / demo1234');
console.log('   manager@demo.com  / demo1234');

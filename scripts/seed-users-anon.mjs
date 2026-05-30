import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdzwjlaugsryljrjnpta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkendqbGF1Z3NyeWxqcmpucHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMzA5NDgsImV4cCI6MjA5NTYwNjk0OH0.LUlGjdzoztgSsSdpf9pPsK8v7NHvpUGq8s-jeEcPt4s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SEED_USERS = [
  { email: 'student@demo.com', password: 'demo1234', full_name: 'Demo Student', role: 'student' },
  { email: 'sales1@demo.com',  password: 'demo1234', full_name: 'Alex Sales',   role: 'sales' },
  { email: 'sales2@demo.com',  password: 'demo1234', full_name: 'Aigerim Sales', role: 'sales' },
  { email: 'manager@demo.com', password: 'demo1234', full_name: 'Demo Manager', role: 'manager' },
];

async function seed() {
  console.log('🌱 Seeding demo users via Supabase API...\n');

  for (const user of SEED_USERS) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.full_name,
          role: user.role
        }
      }
    });

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`✅ Created ${user.email} (${user.role}) - ID: ${data.user?.id}`);
    }
  }

  console.log('\n🎉 Done! You can now log in with the demo accounts.');
}

seed().catch(console.error);

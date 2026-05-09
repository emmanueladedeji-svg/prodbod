import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Seeding dummy organization data...');

  // Note: This script uses the publishable key, so it will only work 
  // if RLS allows or if you run it with a Service Role key.
  
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Functional Test Org',
      description: 'Organization created for functional testing of invitations.',
    })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization:', orgError.message);
    return;
  }

  console.log(`Created Organization: ${org.name} (${org.id})`);

  const testEmails = ['test-member-1@example.com', 'test-member-2@example.com'];
  
  for (const email of testEmails) {
    const { error: memError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        name: email,
        email: email,
        role: 'Staff',
        status: 'Pending',
        invited_by: 'Test Seeder',
        invited_on: new Date().toISOString(),
      });

    if (memError) {
      console.error(`Error creating pending member ${email}:`, memError.message);
    } else {
      console.log(`Created pending member: ${email}`);
    }
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);

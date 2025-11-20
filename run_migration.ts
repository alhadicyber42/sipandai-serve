import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
// NOTE: You need to replace this with your SERVICE_ROLE key (not anon key) from Supabase Dashboard
// Go to: Project Settings > API > service_role key
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY_HERE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('Reading migration file...');

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251120022600_create_employee_ratings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...\n');
    console.log('SQL to execute:');
    console.log('='.repeat(80));
    console.log(sql);
    console.log('='.repeat(80));
    console.log('\n⚠️  This script requires SERVICE_ROLE key, not anon key.');
    console.log('Please run the SQL above manually in Supabase Dashboard > SQL Editor');
    console.log('Or update this script with your service_role key.\n');
}

runMigration();

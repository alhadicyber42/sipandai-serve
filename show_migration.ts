import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA';

async function showMigration() {
    console.log('📋 Employee Ratings Table Migration\n');
    console.log('Please run the following SQL in Supabase Dashboard > SQL Editor:');
    console.log('URL: https://supabase.com/dashboard/project/zebbznlrrvwqclvceeen/sql/new\n');
    console.log('='.repeat(80));

    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251120022600_create_employee_ratings.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(sql);
    console.log('='.repeat(80));
    console.log('\n✅ After running the SQL above, the employee_ratings table will be created.');
    console.log('Then you can test the rating system in the application.\n');
}

showMigration();

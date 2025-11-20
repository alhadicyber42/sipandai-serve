import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking if employee_ratings table exists...\n');

    // Try to query the table
    const { data, error } = await supabase
        .from('employee_ratings')
        .select('*')
        .limit(1);

    if (error) {
        if (error.code === '42P01') {
            console.log('❌ Table employee_ratings does NOT exist.');
            console.log('Error:', error.message);
            console.log('\nYou need to run the migration SQL in Supabase Dashboard.');
        } else {
            console.log('⚠️  Error checking table:', error.message);
            console.log('Error code:', error.code);
        }
    } else {
        console.log('✅ Table employee_ratings EXISTS!');
        console.log('Number of records:', data?.length || 0);
        if (data && data.length > 0) {
            console.log('Sample data:', data);
        }
    }
}

checkTable();

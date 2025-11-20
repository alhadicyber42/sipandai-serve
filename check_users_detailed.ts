import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersDetailed() {
    console.log('Checking all profiles...');
    const { data: allData, error: allError } = await supabase
        .from('profiles')
        .select('*');

    if (allError) {
        console.error('Error fetching all profiles:', allError);
    } else {
        console.log('Total profiles (all roles):', allData?.length || 0);
        if (allData && allData.length > 0) {
            allData.forEach(user => {
                console.log(`  - ID: ${user.id}, Name: ${user.name}, Role: ${user.role}, NIP: ${user.nip}`);
            });
        }
    }

    console.log('\nChecking user_unit profiles only...');
    const { data: unitData, error: unitError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user_unit');

    if (unitError) {
        console.error('Error fetching user_unit profiles:', unitError);
    } else {
        console.log('Total user_unit profiles:', unitData?.length || 0);
        if (unitData && unitData.length > 0) {
            unitData.forEach(user => {
                console.log(`  - ID: ${user.id}, Name: ${user.name}, NIP: ${user.nip}`);
            });
        }
    }
}

checkUsersDetailed();

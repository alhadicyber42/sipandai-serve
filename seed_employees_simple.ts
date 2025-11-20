import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedEmployeesDirectly() {
    // Sample employee data with generated UUIDs
    const employees = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Fanni Zahrina',
            nip: '199001012015032001',
            role: 'user_unit',
            email: 'fanni.zahrina@example.com'
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Ahmad Rizki',
            nip: '198505152010121001',
            role: 'user_unit',
            email: 'ahmad.rizki@example.com'
        },
        {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Siti Nurhaliza',
            nip: '199203202016042002',
            role: 'user_unit',
            email: 'siti.nurhaliza@example.com'
        },
        {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'Budi Santoso',
            nip: '198812102012031003',
            role: 'user_unit',
            email: 'budi.santoso@example.com'
        },
        {
            id: '55555555-5555-5555-5555-555555555555',
            name: 'Dewi Lestari',
            nip: '199506252017052001',
            role: 'user_unit',
            email: 'dewi.lestari@example.com'
        }
    ];

    console.log('Inserting employees directly to profiles table...');

    const { data, error } = await supabase
        .from('profiles')
        .insert(employees);

    if (error) {
        console.error('Error inserting employees:', error.message);
        console.error('Details:', error);
    } else {
        console.log('✓ Successfully inserted', employees.length, 'employees');
        console.log('Data:', data);
    }

    // Verify
    const { data: allProfiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*');

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError);
    } else {
        console.log('\nTotal profiles in database:', allProfiles.length);
        allProfiles.forEach(profile => {
            console.log(`- ${profile.name} (${profile.role})`);
        });
    }
}

seedEmployeesDirectly();

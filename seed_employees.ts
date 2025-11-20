import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zebbznlrrvwqclvceeen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedEmployees() {
    // Sample employee data
    const employees = [
        {
            name: 'Fanni Zahrina',
            nip: '199001012015032001',
            role: 'user_unit',
            email: 'fanni.zahrina@example.com'
        },
        {
            name: 'Ahmad Rizki',
            nip: '198505152010121001',
            role: 'user_unit',
            email: 'ahmad.rizki@example.com'
        },
        {
            name: 'Siti Nurhaliza',
            nip: '199203202016042002',
            role: 'user_unit',
            email: 'siti.nurhaliza@example.com'
        },
        {
            name: 'Budi Santoso',
            nip: '198812102012031003',
            role: 'user_unit',
            email: 'budi.santoso@example.com'
        },
        {
            name: 'Dewi Lestari',
            nip: '199506252017052001',
            role: 'user_unit',
            email: 'dewi.lestari@example.com'
        }
    ];

    console.log('Seeding employees...');

    for (const employee of employees) {
        // First, create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: employee.email,
            password: 'password123', // Default password
            email_confirm: true
        });

        if (authError) {
            console.error(`Error creating auth user for ${employee.name}:`, authError.message);
            continue;
        }

        console.log(`Created auth user for ${employee.name}`);

        // Then create/update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: authData.user.id,
                name: employee.name,
                nip: employee.nip,
                role: employee.role,
                email: employee.email
            });

        if (profileError) {
            console.error(`Error creating profile for ${employee.name}:`, profileError.message);
        } else {
            console.log(`✓ Created profile for ${employee.name}`);
        }
    }

    console.log('\nSeeding complete!');
}

seedEmployees();

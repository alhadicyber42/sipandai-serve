
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zebbznlrrvwqclvceeen.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYmJ6bmxycnZ3cWNsdmNlZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Mjc2NTMsImV4cCI6MjA3NzAwMzY1M30.GK5FW4LufOcek_MHPKahaKkwzo0BoYhfoI2N1DatgHA";

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '6a3d67fe-2551-4365-9f04-a211cddba192';
const expectedUrl = 'https://zebbznlrrvwqclvceeen.supabase.co/storage/v1/object/public/avatars/6a3d67fe-2551-4365-9f04-a211cddba192/avatar.webp';

async function verifyAvatar() {
    console.log(`Verifying system state...`);

    // 1. List all profiles
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url');

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else {
        console.log(`Found ${profiles?.length || 0} profiles:`);
        profiles?.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.name}, Avatar: ${p.avatar_url}`));
    }

    // 2. List all folders in storage
    const { data: files, error: storageError } = await supabase
        .storage
        .from('avatars')
        .list();

    if (storageError) {
        console.error('Error listing bucket root:', storageError);
    } else {
        console.log(`Found ${files?.length || 0} items in bucket root:`);
        files?.forEach(f => console.log(` - ${f.name} (${f.metadata?.mimetype || 'folder'})`));
    }
}

verifyAvatar();

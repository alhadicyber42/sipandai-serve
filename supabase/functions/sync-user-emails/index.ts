import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Syncing user emails from auth to profiles");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin_pusat
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || profile?.role !== 'admin_pusat') {
      return new Response(
        JSON.stringify({ success: false, error: 'Requires admin_pusat role' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all users from auth.users using admin API
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching auth users:", authError);
      throw authError;
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    let updatedCount = 0;
    const updates: { id: string; email: string; name: string }[] = [];

    for (const authUser of authUsers.users) {
      if (authUser.email) {
        // Update the profiles table with the email from auth
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ email: authUser.email })
          .eq("id", authUser.id)
          .is("email", null); // Only update if email is null

        if (!updateError) {
          updatedCount++;
          updates.push({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || "Unknown"
          });
        }
      }
    }

    console.log(`Updated ${updatedCount} profiles with emails`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${updatedCount} emails to profiles`,
        totalAuthUsers: authUsers.users.length,
        updatedProfiles: updatedCount,
        updates
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-user-emails function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Terjadi kesalahan pada server"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

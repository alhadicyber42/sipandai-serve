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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

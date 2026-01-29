import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RetirementReminderRequest {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  retirementDate: string;
  workUnitName: string;
  senderId: string;
}

const formatDateIndonesian = (date: Date): string => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getMonthsUntil = (date: Date): number => {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request to send retirement reminder");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user auth to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      employeeId,
      employeeName,
      employeeEmail,
      retirementDate,
      workUnitName,
      senderId
    }: RetirementReminderRequest = await req.json();

    // SECURITY: Verify sender matches authenticated user
    if (senderId !== userData.user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Sender ID mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for authorization check
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify sender is admin_pusat or admin_unit
    const { data: senderProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, work_unit_id")
      .eq("id", senderId)
      .single();

    if (profileError || !senderProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Sender profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if sender has appropriate role
    if (senderProfile.role !== "admin_pusat" && senderProfile.role !== "admin_unit") {
      return new Response(
        JSON.stringify({ success: false, error: "Requires admin_pusat or admin_unit role" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If admin_unit, verify employee is in their unit
    if (senderProfile.role === "admin_unit") {
      const { data: employeeProfile } = await supabase
        .from("profiles")
        .select("work_unit_id")
        .eq("id", employeeId)
        .single();

      if (employeeProfile?.work_unit_id !== senderProfile.work_unit_id) {
        return new Response(
          JSON.stringify({ success: false, error: "Not authorized to send reminder to this employee" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Authorization verified for sender: ${senderId} (${senderProfile.role})`);

    console.log(`Sending retirement reminder to: ${employeeName} (${employeeEmail})`);

    const retirementDateObj = new Date(retirementDate);
    const formattedDate = formatDateIndonesian(retirementDateObj);
    const monthsUntil = getMonthsUntil(retirementDateObj);

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">SIPANDAI</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0; text-align: center;">Sistem Informasi Pelayanan Administrasi Kepegawaian Digital</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1e40af; margin-top: 0;">Pengingat Masa Pensiun</h2>
        
        <p>Yth. Bapak/Ibu <strong>${employeeName}</strong>,</p>
        
        <p>Melalui surat elektronik ini, kami ingin mengingatkan bahwa masa pensiun Bapak/Ibu akan tiba pada:</p>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 18px;"><strong>📅 Tanggal Pensiun: ${formattedDate}</strong></p>
          <p style="margin: 5px 0 0 0; color: #64748b;">(Sekitar ${monthsUntil} bulan lagi)</p>
        </div>
        
        <h3 style="color: #1e40af;">📋 Langkah Persiapan Pensiun:</h3>
        <ol style="line-height: 2; color: #374151;">
          <li>Melengkapi dokumen persyaratan pensiun</li>
          <li>Menghubungi bagian kepegawaian untuk konsultasi</li>
          <li>Mengajukan permohonan pensiun melalui sistem SIPANDAI</li>
          <li>Mempersiapkan dokumen administrasi yang diperlukan</li>
        </ol>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0;"><strong>⚠️ Penting:</strong> Mohon segera memproses persiapan pensiun Anda untuk memastikan kelancaran proses administrasi.</p>
        </div>
        
        <p>Jika Bapak/Ibu memiliki pertanyaan atau memerlukan bantuan, silakan hubungi bagian kepegawaian atau gunakan fitur Konsultasi di aplikasi SIPANDAI.</p>
        
        <p style="margin-top: 30px;">Hormat kami,</p>
        <p><strong>${workUnitName}</strong></p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 12px; color: #64748b; margin: 0; text-align: center;">
          Email ini dikirim secara otomatis dari sistem SIPANDAI.<br>
          Mohon tidak membalas email ini.
        </p>
      </div>
    </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "SIPANDAI <noreply@sipandai.site>",
      to: [employeeEmail],
      subject: `📢 Pengingat: Masa Pensiun Anda ${monthsUntil} Bulan Lagi`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log to database using the already-initialized supabase client

    // Insert reminder log
    const { error: logError } = await supabase
      .from("retirement_reminders")
      .insert({
        user_id: employeeId,
        reminder_type: "email",
        sender_id: senderId,
        status: "sent",
        message: `Email reminder sent to ${employeeEmail}`
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    // Update last reminder sent timestamp
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ retirement_reminder_sent_at: new Date().toISOString() })
      .eq("id", employeeId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retirement-reminder function:", error);
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

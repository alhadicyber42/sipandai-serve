import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received message:', message);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for relevant FAQs in database
    const searchTerms = message.toLowerCase().split(' ').filter((word: string) => word.length > 2);
    
    console.log('Searching FAQs with terms:', searchTerms);

    // Build search query using text search
    const { data: faqs, error: faqError } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .or(`question.ilike.%${message}%,answer.ilike.%${message}%`)
      .limit(5);

    if (faqError) {
      console.error('FAQ search error:', faqError);
    }

    console.log('Found FAQs:', faqs?.length || 0);

    // Prepare context from FAQs
    let faqContext = '';
    let foundInDatabase = false;

    if (faqs && faqs.length > 0) {
      foundInDatabase = true;
      faqContext = faqs.map((faq: any) => 
        `Kategori: ${faq.category}\nPertanyaan: ${faq.question}\nJawaban: ${faq.answer}`
      ).join('\n\n---\n\n');
    }

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build system prompt based on whether we found FAQ data
    let systemPrompt = `Kamu adalah asisten AI untuk aplikasi SIPANDAI (Sistem Informasi Pelayanan Administrasi Kepegawaian Digital).
Tugasmu adalah membantu pengguna memahami cara menggunakan aplikasi, prosedur pengajuan layanan, dan menjawab pertanyaan terkait kebijakan kepegawaian.

Berikut adalah fitur-fitur utama aplikasi SIPANDAI:
1. Dashboard - Halaman utama yang menampilkan ringkasan informasi
2. Layanan Kepegawaian:
   - Kenaikan Pangkat - Pengajuan kenaikan pangkat/golongan
   - Mutasi - Pengajuan perpindahan unit kerja
   - Pensiun - Pengajuan pensiun
   - Cuti - Pengajuan berbagai jenis cuti (tahunan, sakit, melahirkan, dll)
3. Konsultasi - Fitur untuk berkonsultasi dengan admin unit atau admin pusat
4. Employee of the Month - Penilaian dan pemilihan pegawai terbaik bulanan
5. Profil - Pengaturan data pribadi dan kepegawaian
6. Pengumuman - Informasi dan pengumuman penting

Alur pengajuan layanan:
1. User Unit mengajukan permohonan dengan melengkapi dokumen
2. Admin Unit mereview dan memverifikasi dokumen
3. Jika disetujui Admin Unit, diteruskan ke Admin Pusat
4. Admin Pusat melakukan review final
5. Status pengajuan bisa dipantau di halaman layanan

`;

    if (foundInDatabase) {
      systemPrompt += `\nBerikut adalah informasi dari basis data FAQ yang relevan dengan pertanyaan pengguna:\n\n${faqContext}\n\nGunakan informasi di atas untuk menjawab pertanyaan pengguna. Jawab dengan ramah, jelas, dan dalam Bahasa Indonesia.`;
    } else {
      systemPrompt += `\nTidak ditemukan informasi spesifik di basis data FAQ untuk pertanyaan ini. 
Jika kamu tidak yakin dengan jawabannya, berikan jawaban umum berdasarkan pengetahuanmu dan tambahkan catatan:
"💡 Catatan: Informasi ini berdasarkan pengetahuan umum saya. Untuk informasi lebih detail dan akurat, silakan hubungi Admin Unit atau Admin Pusat melalui fitur Konsultasi."`;
    }

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    console.log('Calling Lovable AI...');

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Layanan AI sedang sibuk. Silakan coba lagi dalam beberapa saat.',
            isRateLimited: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Kuota AI telah habis. Silakan hubungi administrator.',
            isPaymentRequired: true
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiMessage = aiResponse.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.';

    console.log('AI response received successfully');

    // Prepare final response
    let finalResponse = aiMessage;
    
    // Add source indicator
    if (!foundInDatabase && !aiMessage.includes('💡 Catatan')) {
      finalResponse += '\n\n💡 *Catatan: Jawaban ini berdasarkan pengetahuan umum AI. Untuk informasi resmi, silakan hubungi Admin melalui fitur Konsultasi.*';
    }

    return new Response(
      JSON.stringify({ 
        response: finalResponse,
        foundInDatabase,
        faqCount: faqs?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chatbot function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
        response: 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

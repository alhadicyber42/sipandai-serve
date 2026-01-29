import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive application knowledge base
const APP_KNOWLEDGE = `
# SIPANDAI - Sistem Informasi Pelayanan Administrasi Kepegawaian Digital

## STRUKTUR MENU BERDASARKAN ROLE

### 1. User Unit (Pegawai Biasa)
Menu yang tersedia:
- **Dashboard** - Halaman utama dengan ringkasan informasi
- **Layanan Saya** (dropdown):
  - Kenaikan Pangkat - Mengajukan usulan kenaikan pangkat/golongan
  - Mutasi Pegawai - Mengajukan perpindahan unit kerja
  - Pensiun - Mengajukan pensiun
  - Cuti Pegawai - Mengajukan berbagai jenis cuti
- **Konsultasi** (dropdown):
  - Buat Konsultasi Baru - Mengajukan pertanyaan ke Admin Unit atau Admin Pusat
  - Riwayat Konsultasi - Melihat histori konsultasi yang pernah diajukan
- **Employee of The Month** - Melihat leaderboard dan memberikan penilaian rekan kerja
- **Profil** - Mengelola data pribadi dan kepegawaian

### 2. Admin Unit
Menu yang tersedia:
- **Dashboard** - Ringkasan statistik usulan unit
- **Usulan Masuk** (dropdown):
  - Kenaikan Pangkat - Review usulan kenaikan pangkat dari pegawai unit
  - Mutasi Pegawai - Review usulan mutasi dari pegawai unit
  - Pensiun - Review usulan pensiun dari pegawai unit
  - Cuti Pegawai - Review usulan cuti dari pegawai unit
- **Konsultasi Unit** (dropdown):
  - Konsultasi Masuk - Menjawab konsultasi dari pegawai unit
  - Riwayat Konsultasi - Histori konsultasi unit
- **Daftar Pegawai Unit** - Melihat dan mengelola data pegawai di unit
- **Formasi Jabatan** - Mengelola formasi jabatan di unit
- **Reminder Pensiun** - Melihat pegawai yang akan memasuki masa pensiun
- **Buat Surat** - Membuat surat keputusan/dokumen resmi
- **Employee of The Month** - Evaluasi dan penilaian pegawai terbaik
- **Kelola Pengumuman** - Membuat dan mengelola pengumuman untuk unit
- **Kelola FAQ** - Mengelola basis pengetahuan AI chatbot
- **Profil** - Mengelola data pribadi

### 3. Admin Pusat
Menu yang tersedia:
- **Dashboard** - Statistik seluruh usulan dari semua unit
- **Semua Usulan** (dropdown):
  - Kenaikan Pangkat - Review final usulan kenaikan pangkat
  - Mutasi Pegawai - Review final usulan mutasi
  - Pensiun - Review final usulan pensiun
  - Cuti Pegawai - Review final usulan cuti
- **Konsultasi** (dropdown):
  - Konsultasi Masuk - Menjawab konsultasi yang dieskalasi ke pusat
- **Kelola Admin Unit** - Mengelola akun admin unit
- **Kelola Unit Kerja** - Mengelola daftar unit kerja
- **Daftar Pegawai Unit** - Melihat pegawai dari semua unit
- **Formasi Jabatan** - Mengelola formasi jabatan semua unit
- **Reminder Pensiun** - Melihat pegawai yang akan pensiun dari semua unit
- **Employee of The Month** - Evaluasi final pegawai terbaik
- **Penangguhan Cuti** - Mengelola pengajuan penangguhan cuti
- **Buat Surat** - Membuat surat keputusan resmi
- **Kelola Pengumuman** - Membuat pengumuman untuk seluruh organisasi
- **Kelola FAQ** - Mengelola basis pengetahuan AI chatbot
- **Profil** - Mengelola data pribadi

---

## ALUR PENGAJUAN LAYANAN

### Alur Umum:
1. **User Unit** membuat pengajuan baru dengan mengisi form dan melengkapi dokumen
2. Status awal: "Draft" (bisa diedit) atau "Submitted" (sudah diajukan)
3. **Admin Unit** mereview dokumen dan memverifikasi kelengkapan
4. Jika ada dokumen kurang/salah: Admin Unit mengembalikan ke User Unit dengan catatan "Perlu Perbaikan"
5. User Unit memperbaiki dan submit ulang
6. Jika lengkap: Admin Unit menyetujui → status "Disetujui Unit"
7. **Admin Pusat** melakukan review final
8. Admin Pusat bisa: Menyetujui Final, Menolak, atau Mengembalikan ke Admin Unit
9. Status akhir: "Disetujui Final" atau "Ditolak"

### Status Pengajuan:
- **Draft** - Masih dalam penyusunan, belum diajukan
- **Submitted** - Sudah diajukan, menunggu review Admin Unit
- **Under Review Unit** - Sedang direview Admin Unit
- **Returned to User** - Dikembalikan ke User untuk perbaikan dokumen
- **Approved by Unit** - Disetujui Admin Unit, menunggu review Admin Pusat
- **Under Review Central** - Sedang direview Admin Pusat
- **Returned to Unit** - Dikembalikan ke Admin Unit
- **Approved Final** - Disetujui final oleh Admin Pusat
- **Rejected** - Ditolak
- **Resubmitted** - Sudah diperbaiki dan diajukan ulang

---

## FITUR LAYANAN DETAIL

### 1. Kenaikan Pangkat
**Cara mengajukan:**
1. Buka menu "Layanan Saya" → "Kenaikan Pangkat"
2. Klik tombol "Ajukan Kenaikan Pangkat" (biru, pojok kanan atas)
3. Pilih kategori kenaikan pangkat:
   - Kenaikan Pangkat Reguler
   - Kenaikan Pangkat Pilihan
   - Kenaikan Pangkat Fungsional Tertentu
   - Kenaikan Pangkat Penyesuaian Ijazah
   - Kenaikan Pangkat Tugas Belajar
   - Kenaikan Pangkat Pengabdian
4. Pilih periode pengajuan (bulan dan tahun)
5. Lengkapi dokumen sesuai kategori yang dipilih (upload link dokumen)
6. Klik "Ajukan" untuk submit

**Dokumen yang biasanya diperlukan:**
- SK Pangkat Terakhir
- SK Jabatan
- PAK (Penetapan Angka Kredit) untuk fungsional
- Ijazah terakhir
- Transkrip nilai
- Sertifikat diklat/pelatihan
- Dan lainnya sesuai kategori

### 2. Mutasi Pegawai
**Cara mengajukan:**
1. Buka menu "Layanan Saya" → "Mutasi Pegawai"
2. Klik tombol "Ajukan Mutasi"
3. Pilih kategori mutasi:
   - Mutasi Antar Unit dalam Eselon
   - Mutasi Antar Unit Eselon I
   - Mutasi Antar Kementerian/Lembaga
4. Pilih unit kerja tujuan
5. Pilih formasi jabatan yang dituju (jika ada)
6. Lengkapi dokumen persyaratan
7. Klik "Ajukan"

### 3. Pensiun
**Cara mengajukan:**
1. Buka menu "Layanan Saya" → "Pensiun"
2. Klik tombol "Ajukan Pensiun"
3. Pilih jenis pensiun:
   - Pensiun Batas Usia
   - Pensiun Dini / Atas Permintaan Sendiri
   - Pensiun Janda/Duda
   - Pensiun Cacat
   - Pensiun Meninggal Dunia
   - Dan kategori lainnya
4. Lengkapi dokumen sesuai jenis pensiun
5. Klik "Ajukan"

### 4. Cuti Pegawai
**Cara mengajukan:**
1. Buka menu "Layanan Saya" → "Cuti Pegawai"
2. Klik tombol "Ajukan Cuti"
3. Pilih jenis cuti:
   - Cuti Tahunan (max 12 hari/tahun)
   - Cuti Sakit
   - Cuti Melahirkan (3 bulan)
   - Cuti Alasan Penting
   - Cuti Besar
   - Cuti Bersama
   - Cuti Di Luar Tanggungan Negara
4. Tentukan tanggal mulai dan selesai cuti
5. Isi alasan pengajuan cuti
6. Masukkan nama pegawai pengganti (opsional)
7. Masukkan kontak darurat (opsional)
8. Klik "Ajukan"

---

## FITUR KONSULTASI

### Cara membuat konsultasi baru:
1. Buka menu "Konsultasi" → "Buat Konsultasi Baru"
2. Pilih tujuan konsultasi:
   - **Admin Unit** - Untuk pertanyaan terkait unit kerja
   - **Admin Pusat** - Untuk pertanyaan kebijakan pusat
3. Pilih kategori:
   - Kepegawaian
   - Administrasi
   - Teknis
   - Lainnya
4. Pilih prioritas: Rendah, Sedang, atau Tinggi
5. Isi subjek dan deskripsi pertanyaan
6. Klik "Kirim Konsultasi"

### Cara melihat balasan:
1. Buka menu "Konsultasi" → "Riwayat Konsultasi"
2. Klik pada konsultasi yang ingin dilihat
3. Anda bisa membalas pesan jika ada tindak lanjut

---

## FITUR EMPLOYEE OF THE MONTH

### Untuk User Unit:
1. Buka menu "Employee of The Month"
2. Lihat leaderboard pegawai terbaik bulan ini
3. Klik "Nilai" pada pegawai yang ingin dinilai
4. Berikan penilaian berdasarkan kriteria:
   - Kualitas Kerja
   - Kuantitas Kerja
   - Kerjasama Tim
   - Disiplin
   - Inisiatif
5. Tulis alasan/testimoni penilaian
6. Klik "Submit Penilaian"

**Catatan:** Anda hanya bisa menilai setiap pegawai satu kali per periode.

### Untuk Admin Unit:
1. Bisa memberikan evaluasi tambahan dengan faktor:
   - Penalti Hukuman Disiplin (-15%)
   - Penalti Kehadiran (-5%)
   - Penalti E-Performance (-5%)
   - Bonus Kontribusi (+10%)

### Untuk Admin Pusat:
1. Melakukan evaluasi final
2. Dapat menyesuaikan semua komponen penilaian
3. Hasil evaluasi Admin Pusat menjadi penentu pemenang

---

## FITUR PROFIL

### Informasi yang bisa dikelola:
**Data Pribadi:**
- Nama lengkap
- NIP / NIK (ASN: NIP, Non-ASN: NIK)
- Email dan email alternatif
- Nomor HP dan WhatsApp
- Tempat dan tanggal lahir
- Alamat lengkap
- Jenis kelamin
- Agama
- Status perkawinan
- Foto profil/avatar
- Riwayat pendidikan

**Data Kepegawaian:**
- Unit kerja
- Jabatan
- Pangkat/Golongan
- TMT PNS (Terhitung Mulai Tanggal PNS)
- TMT Pensiun
- Kriteria ASN (ASN atau Non-ASN)
- Masa kerja
- Riwayat jabatan
- Riwayat mutasi
- Riwayat diklat
- Riwayat uji kompetensi

---

## TIPS PENGGUNAAN

1. **Pastikan semua dokumen lengkap** sebelum mengajukan layanan
2. **Pantau status pengajuan** secara berkala di halaman layanan
3. **Segera perbaiki** jika ada dokumen yang dikembalikan
4. **Gunakan fitur konsultasi** jika ada pertanyaan, bukan mengajukan ulang
5. **Update data profil** secara berkala agar data kepegawaian akurat
6. **Berikan penilaian yang objektif** untuk Employee of The Month

---

## KONTAK BANTUAN

Jika mengalami kendala teknis atau membutuhkan bantuan lebih lanjut:
1. Gunakan fitur "Konsultasi" untuk menghubungi Admin Unit atau Admin Pusat
2. Pilih kategori "Teknis" untuk masalah aplikasi
3. Jelaskan masalah dengan detail untuk respon yang lebih cepat
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [], userRole } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received message:', message);
    console.log('User role:', userRole);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for relevant FAQs in database
    console.log('Searching FAQs...');

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
      faqContext = `\n\n## INFORMASI TAMBAHAN DARI DATABASE FAQ:\n\n` + 
        faqs.map((faq: any) => 
          `**Kategori:** ${faq.category}\n**Pertanyaan:** ${faq.question}\n**Jawaban:** ${faq.answer}`
        ).join('\n\n---\n\n');
    }

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build comprehensive system prompt
    const roleContext = userRole === 'admin_pusat' 
      ? 'Pengguna ini adalah Admin Pusat yang memiliki akses penuh ke semua fitur administratif.'
      : userRole === 'admin_unit'
      ? 'Pengguna ini adalah Admin Unit yang mengelola usulan dan pegawai di unitnya.'
      : 'Pengguna ini adalah User Unit (pegawai biasa) yang bisa mengajukan layanan kepegawaian.';

    const systemPrompt = `Kamu adalah Asisten AI resmi untuk aplikasi SIPANDAI (Sistem Informasi Pelayanan Administrasi Kepegawaian Digital).

${roleContext}

Tugasmu adalah membantu pengguna dengan:
1. Menjelaskan cara menggunakan fitur-fitur aplikasi
2. Membimbing langkah-langkah pengajuan layanan kepegawaian
3. Menjawab pertanyaan seputar prosedur dan kebijakan
4. Memberikan informasi tentang dokumen yang diperlukan

PENTING - Panduan Menjawab:
- Gunakan bahasa Indonesia yang sopan dan ramah
- Berikan langkah-langkah yang jelas dan terstruktur
- Sebutkan nama menu persis seperti yang ada di aplikasi
- Jika tidak yakin, sarankan pengguna untuk menggunakan fitur Konsultasi

${APP_KNOWLEDGE}
${faqContext}

Jika pertanyaan tidak terkait dengan SIPANDAI atau kepegawaian, jawab dengan sopan bahwa kamu adalah asisten khusus untuk aplikasi SIPANDAI.`;

    // Prepare messages for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
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
        max_tokens: 1500,
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
    
    // Add source indicator if FAQ was found
    if (foundInDatabase) {
      finalResponse += '\n\n📚 *Informasi ini diperkuat dengan data dari basis pengetahuan FAQ.*';
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

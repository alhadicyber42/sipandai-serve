import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
                <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-bold">Kebijakan Privasi</h1>
                </div>
            </header>

            <main className="flex-1 container py-8 px-4 md:px-6 max-w-4xl mx-auto">
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                            <Shield className="h-12 w-12" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kebijakan Privasi SIPANDAI</h1>
                        <p className="text-muted-foreground text-lg">
                            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Pendahuluan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                            <p>
                                SIPANDAI ("kami") berkomitmen untuk melindungi privasi dan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan Sistem Pelayanan Administrasi Digital ASN Terintegrasi.
                            </p>
                            <p>
                                Dengan menggunakan layanan SIPANDAI, Anda menyetujui praktik data yang dijelaskan dalam kebijakan ini. Layanan ini ditujukan khusus untuk keperluan administrasi Aparatur Sipil Negara (ASN).
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" />
                                Informasi yang Kami Kumpulkan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                            <p>Kami mengumpulkan informasi yang diperlukan untuk keperluan administrasi kepegawaian, termasuk namun tidak terbatas pada:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Data Identitas:</strong> Nama lengkap, NIP (Nomor Induk Pegawai), NIK, tempat dan tanggal lahir.</li>
                                <li><strong>Data Kontak:</strong> Alamat email, nomor telepon, dan alamat tempat tinggal.</li>
                                <li><strong>Data Kepegawaian:</strong> Riwayat jabatan, pangkat/golongan, unit kerja, dan riwayat pendidikan.</li>
                                <li><strong>Dokumen Digital:</strong> Berkas SK, sertifikat diklat, dan dokumen pendukung lainnya yang diunggah ke sistem.</li>
                                <li><strong>Data Aktivitas:</strong> Log akses, riwayat pengajuan layanan, dan interaksi dengan sistem.</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Penggunaan dan Keamanan Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-muted-foreground leading-relaxed space-y-4">
                            <p>
                                Data yang kami kumpulkan digunakan semata-mata untuk keperluan manajemen kepegawaian, pemrosesan layanan administrasi, dan pelaporan internal instansi.
                            </p>
                            <p>
                                Kami menerapkan langkah-langkah keamanan teknis dan organisasional yang sesuai untuk melindungi data Anda dari akses tidak sah, perubahan, pengungkapan, atau perusakan. Ini termasuk enkripsi data, kontrol akses ketat, dan audit keamanan berkala.
                            </p>
                            <p>
                                Kami <strong>tidak akan pernah</strong> menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan komersial. Berbagi data hanya dilakukan dengan instansi pemerintah terkait sesuai dengan peraturan perundang-undangan yang berlaku.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="text-center text-sm text-muted-foreground pt-8">
                        <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi tim admin SIPANDAI melalui saluran komunikasi internal.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

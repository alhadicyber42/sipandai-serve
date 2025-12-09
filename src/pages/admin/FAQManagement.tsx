import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTableWrapper } from '@/components/ui/responsive-table';
import { Plus, Pencil, Trash2, Search, HelpCircle, Bot, MessageSquare, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/skeletons';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  is_active: boolean;
  created_by: string;
  work_unit_id: number | null;
  created_at: string;
  updated_at: string;
}

interface WorkUnit {
  id: number;
  name: string;
  code: string;
}

const FAQ_CATEGORIES = [
  { value: 'layanan', label: 'Layanan Kepegawaian' },
  { value: 'prosedur', label: 'Prosedur & Alur' },
  { value: 'dokumen', label: 'Persyaratan Dokumen' },
  { value: 'kebijakan', label: 'Kebijakan' },
  { value: 'aplikasi', label: 'Penggunaan Aplikasi' },
  { value: 'umum', label: 'Umum' },
];

export default function FAQManagement() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: '',
    keywords: '',
    is_active: true,
    work_unit_id: null as number | null,
  });

  const isAdminPusat = user?.role === 'admin_pusat';
  const isAdminUnit = user?.role === 'admin_unit';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load FAQs
      let query = supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });

      // Admin unit can only see their unit's FAQs
      if (isAdminUnit && user?.work_unit_id) {
        query = query.eq('work_unit_id', user.work_unit_id);
      }

      const { data: faqData, error: faqError } = await query;
      if (faqError) throw faqError;
      setFaqs(faqData || []);

      // Load work units for admin pusat
      if (isAdminPusat) {
        const { data: unitData, error: unitError } = await supabase
          .from('work_units')
          .select('id, name, code')
          .order('name');
        if (unitError) throw unitError;
        setWorkUnits(unitData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setSelectedFAQ(faq);
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords?.join(', ') || '',
        is_active: faq.is_active,
        work_unit_id: faq.work_unit_id,
      });
    } else {
      setSelectedFAQ(null);
      setFormData({
        category: '',
        question: '',
        answer: '',
        keywords: '',
        is_active: true,
        work_unit_id: isAdminUnit ? user?.work_unit_id || null : null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.category || !formData.question || !formData.answer) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      const faqData = {
        category: formData.category,
        question: formData.question,
        answer: formData.answer,
        keywords: keywordsArray,
        is_active: formData.is_active,
        work_unit_id: isAdminUnit ? user?.work_unit_id : formData.work_unit_id,
        created_by: user?.id,
      };

      if (selectedFAQ) {
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', selectedFAQ.id);
        if (error) throw error;
        toast.success('FAQ berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert(faqData);
        if (error) throw error;
        toast.success('FAQ berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error('Gagal menyimpan FAQ');
    }
  };

  const handleDelete = async () => {
    if (!selectedFAQ) return;

    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', selectedFAQ.id);
      if (error) throw error;
      
      toast.success('FAQ berhasil dihapus');
      setDeleteDialogOpen(false);
      setSelectedFAQ(null);
      loadData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Gagal menghapus FAQ');
    }
  };

  const toggleActive = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: !faq.is_active })
        .eq('id', faq.id);
      if (error) throw error;
      
      toast.success(`FAQ ${!faq.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadData();
    } catch (error) {
      console.error('Error toggling FAQ:', error);
      toast.error('Gagal mengubah status FAQ');
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  if (!isAdminPusat && !isAdminUnit) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Manajemen FAQ
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola basis pengetahuan untuk Asisten AI SIPANDAI
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah FAQ
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{faqs.length}</p>
                  <p className="text-xs text-muted-foreground">Total FAQ</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Bot className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{faqs.filter(f => f.is_active).length}</p>
                  <p className="text-xs text-muted-foreground">FAQ Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <HelpCircle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{new Set(faqs.map(f => f.category)).size}</p>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Search className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{faqs.reduce((acc, f) => acc + (f.keywords?.length || 0), 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Keywords</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari pertanyaan, jawaban, atau keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {FAQ_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar FAQ</CardTitle>
            <CardDescription>
              FAQ yang aktif akan digunakan sebagai referensi oleh Asisten AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton />
            ) : filteredFaqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada FAQ yang tersedia</p>
                <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah FAQ Pertama
                </Button>
              </div>
            ) : (
              <ResponsiveTableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="min-w-[250px]">Pertanyaan</TableHead>
                      <TableHead className="min-w-[300px]">Jawaban</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFaqs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {FAQ_CATEGORIES.find(c => c.value === faq.category)?.label || faq.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          <p className="line-clamp-2">{faq.question}</p>
                        </TableCell>
                        <TableCell>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{faq.answer}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {faq.keywords?.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {faq.keywords && faq.keywords.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{faq.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={faq.is_active}
                            onCheckedChange={() => toggleActive(faq)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(faq)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedFAQ(faq);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableWrapper>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedFAQ ? 'Edit FAQ' : 'Tambah FAQ Baru'}
              </DialogTitle>
              <DialogDescription>
                FAQ ini akan menjadi referensi Asisten AI untuk menjawab pertanyaan pengguna
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAdminPusat && (
                  <div className="space-y-2">
                    <Label htmlFor="work_unit">Unit Kerja (Opsional)</Label>
                    <Select
                      value={formData.work_unit_id?.toString() || 'none'}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        work_unit_id: value === 'none' ? null : parseInt(value) 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua unit (global)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Semua Unit (Global)</SelectItem>
                        {workUnits.map(unit => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Pertanyaan *</Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Contoh: Bagaimana cara mengajukan cuti tahunan?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Jawaban *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Tuliskan jawaban yang lengkap dan jelas..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (pisahkan dengan koma)</Label>
                <Input
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="cuti, tahunan, libur, izin"
                />
                <p className="text-xs text-muted-foreground">
                  Keywords membantu AI menemukan FAQ yang relevan dengan pertanyaan pengguna
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <Label htmlFor="is_active">Status Aktif</Label>
                  <p className="text-xs text-muted-foreground">
                    FAQ aktif akan digunakan oleh AI sebagai referensi
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {selectedFAQ ? 'Simpan Perubahan' : 'Tambah FAQ'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus FAQ</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus FAQ ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

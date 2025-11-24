import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle, FileText, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentVerification, type VerifiedDocument } from "@/components/DocumentVerification";
import { TableSkeleton } from "@/components/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoDataState, SearchState } from "@/components/EmptyState";

interface Service {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  user_id: string;
  work_unit_id: number;
  service_type: string;
  notes: any[];
  documents?: VerifiedDocument[];
  profiles?: { name: string };
  work_units?: { name: string };
}

interface ServiceListProps {
  services: Service[];
  isLoading: boolean;
  onReload: () => void;
  showFilters?: boolean;
  allowActions?: boolean;
  onEditService?: (service: Service) => void;
}

export function ServiceList({
  services,
  isLoading,
  onReload,
  showFilters = true,
  allowActions = true,
  onEditService,
}: ServiceListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "return">("approve");
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifiedDocuments, setVerifiedDocuments] = useState<VerifiedDocument[]>([]);
  const [isSavingVerification, setIsSavingVerification] = useState(false);

  const handleApprove = async () => {
    if (!selectedService) return;

    // Check if all documents are verified
    if (verifiedDocuments && verifiedDocuments.length > 0) {
      const hasUnverified = verifiedDocuments.some(
        doc => doc.verification_status === "menunggu_review"
      );
      const needsRevision = verifiedDocuments.some(
        doc => doc.verification_status === "perlu_perbaikan"
      );

      if (hasUnverified) {
        toast.error("Masih ada dokumen yang belum diverifikasi");
        return;
      }

      if (needsRevision) {
        toast.error("Ada dokumen yang perlu perbaikan. Silakan kembalikan usulan terlebih dahulu.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const newStatus =
        user?.role === "admin_unit" ? "approved_by_unit" : "approved_final";

      const { error } = await supabase
        .from("services")
        .update({
          status: newStatus,
          approved_at: new Date().toISOString(),
          documents: (verifiedDocuments && verifiedDocuments.length > 0 ? verifiedDocuments : selectedService.documents) as any,
          notes: [
            ...(selectedService.notes || []),
            {
              actor: user?.name,
              role: user?.role,
              note: actionNote || "Disetujui",
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq("id", selectedService.id);

      if (error) throw error;

      // Add to service history
      await supabase.from("service_history").insert({
        service_id: selectedService.id,
        service_type: selectedService.service_type as any,
        action: "approved",
        actor_id: user!.id,
        actor_role: user!.role as any,
        notes: actionNote || "Disetujui",
      });

      toast.success("Usulan berhasil disetujui");
      setIsActionDialogOpen(false);
      setIsDetailOpen(false);
      setSelectedService(null);
      setActionNote("");
      setVerifiedDocuments([]);
      onReload();
    } catch (error: any) {
      console.error("Error approving service:", error);
      toast.error("Gagal menyetujui usulan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedService) return;

    // Check if documents have been reviewed
    if (verifiedDocuments && verifiedDocuments.length > 0) {
      const hasUnverified = verifiedDocuments.some(
        doc => doc.verification_status === "menunggu_review"
      );

      if (hasUnverified) {
        toast.error("Harap tinjau semua dokumen sebelum mengembalikan usulan");
        return;
      }

      const needsRevision = verifiedDocuments.some(
        doc => doc.verification_status === "perlu_perbaikan"
      );

      if (!needsRevision && !actionNote.trim()) {
        toast.error("Alasan pengembalian wajib diisi");
        return;
      }
    } else if (!actionNote.trim()) {
      toast.error("Alasan pengembalian wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const newStatus =
        user?.role === "admin_unit" ? "returned_to_user" : "returned_to_unit";

      const { error } = await supabase
        .from("services")
        .update({
          status: newStatus,
          rejected_at: new Date().toISOString(),
          documents: (verifiedDocuments && verifiedDocuments.length > 0 ? verifiedDocuments : selectedService.documents) as any,
          notes: [
            ...(selectedService.notes || []),
            {
              actor: user?.name,
              role: user?.role,
              note: actionNote || "Dikembalikan untuk perbaikan dokumen",
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq("id", selectedService.id);

      if (error) throw error;

      // Add to service history
      await supabase.from("service_history").insert({
        service_id: selectedService.id,
        service_type: selectedService.service_type as any,
        action: "returned",
        actor_id: user!.id,
        actor_role: user!.role as any,
        notes: actionNote || "Dikembalikan untuk perbaikan dokumen",
      });

      toast.success("Usulan dikembalikan untuk revisi");
      setIsActionDialogOpen(false);
      setIsDetailOpen(false);
      setSelectedService(null);
      setActionNote("");
      setVerifiedDocuments([]);
      onReload();
    } catch (error: any) {
      console.error("Error returning service:", error);
      toast.error("Gagal mengembalikan usulan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionDialog = (service: Service, type: "approve" | "return") => {
    setSelectedService(service);
    setActionType(type);
    setActionNote("");
    setIsDetailOpen(false);
    setIsActionDialogOpen(true);
  };

  const handleDetailOpen = (service: Service) => {
    setSelectedService(service);
    setVerifiedDocuments(service.documents || []);
    setIsDetailOpen(true);
  };

  const handleSaveVerification = async () => {
    if (!selectedService) return;

    setIsSavingVerification(true);
    try {
      const { error } = await supabase
        .from("services")
        .update({
          documents: verifiedDocuments as any,
        })
        .eq("id", selectedService.id);

      if (error) throw error;

      toast.success("Hasil verifikasi berhasil disimpan");

      // Check if any document needs revision
      const hasDocumentsNeedingRevision = verifiedDocuments.some(
        doc => doc.verification_status === "perlu_perbaikan"
      );

      // Auto-suggest returning if documents need revision
      if (hasDocumentsNeedingRevision) {
        toast.info("Ada dokumen yang perlu perbaikan. Silakan kembalikan usulan.", {
          duration: 5000,
        });
      }

      // Update selected service with new documents
      setSelectedService({
        ...selectedService,
        documents: verifiedDocuments,
      });

      onReload();
    } catch (error: any) {
      console.error("Error saving verification:", error);
      toast.error("Gagal menyimpan hasil verifikasi");
    } finally {
      setIsSavingVerification(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.work_units?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || service.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const canTakeAction = (service: Service) => {
    if (!allowActions) return false;
    if (user?.role === "admin_unit") {
      return service.status === "submitted" && service.work_unit_id === user.work_unit_id;
    }
    if (user?.role === "admin_pusat") {
      return service.status === "submitted" || service.status === "approved_by_unit";
    }
    return false;
  };

  const canEditService = (service: Service) => {
    return onEditService && user?.role === "user_unit" && service.status === "returned_to_user";
  };

  return (
    <>
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan judul, pemohon, atau unit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Diajukan</SelectItem>
                    <SelectItem value="approved_by_unit">Disetujui Unit</SelectItem>
                    <SelectItem value="approved_final">Disetujui Final</SelectItem>
                    <SelectItem value="returned_to_user">Dikembalikan ke User</SelectItem>
                    <SelectItem value="returned_to_unit">Dikembalikan ke Unit</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daftar Usulan
            {filteredServices.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredServices.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4">
              <TableSkeleton rows={5} />
            </div>
          ) : filteredServices.length === 0 ? (
            services.length === 0 ? (
              <NoDataState message="Belum ada usulan yang diajukan" />
            ) : (
              <SearchState message="Tidak ada usulan yang sesuai dengan filter pencarian" />
            )
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Unit Kerja</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {service.title}
                      </TableCell>
                      <TableCell>{service.profiles?.name || "-"}</TableCell>
                      <TableCell>{service.work_units?.name || "-"}</TableCell>
                      <TableCell>
                        {format(new Date(service.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={service.status} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDetailOpen(service)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detail
                        </Button>
                        {canEditService(service) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditService!(service)}
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Perbaiki
                          </Button>
                        )}
                        {canTakeAction(service) && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openActionDialog(service, "approve")}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Setujui
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionDialog(service, "return")}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Kembalikan
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Usulan</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informasi</TabsTrigger>
                <TabsTrigger value="documents">
                  Dokumen
                  {selectedService.documents && selectedService.documents.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedService.documents.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Pemohon</Label>
                    <p className="text-sm mt-1">{selectedService.profiles?.name || "-"}</p>
                  </div>
                  <div>
                    <Label>Unit Kerja</Label>
                    <p className="text-sm mt-1">{selectedService.work_units?.name || "-"}</p>
                  </div>
                </div>

                <div>
                  <Label>Judul</Label>
                  <p className="text-sm mt-1">{selectedService.title}</p>
                </div>

                <div>
                  <Label>Deskripsi</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {selectedService.description || "-"}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tanggal Diajukan</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(selectedService.created_at), "dd MMMM yyyy HH:mm", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedService.status} />
                    </div>
                  </div>
                </div>

                {selectedService.notes && selectedService.notes.length > 0 && (
                  <div>
                    <Label>Riwayat</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                      {selectedService.notes.map((note: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                          <p className="font-medium">{note.actor}</p>
                          <p className="text-muted-foreground">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(note.timestamp), "dd MMM yyyy, HH:mm")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canTakeAction(selectedService) && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => openActionDialog(selectedService, "approve")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Setujui
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => openActionDialog(selectedService, "return")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Kembalikan
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-4 space-y-4">
                {selectedService.documents && selectedService.documents.length > 0 ? (
                  <>
                    <DocumentVerification
                      documents={verifiedDocuments.length > 0 ? verifiedDocuments : selectedService.documents}
                      onUpdate={setVerifiedDocuments}
                      readOnly={!canTakeAction(selectedService)}
                    />

                    {canTakeAction(selectedService) && (
                      <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
                        <Button
                          onClick={handleSaveVerification}
                          disabled={isSavingVerification}
                          className="flex-1"
                          variant="outline"
                        >
                          {isSavingVerification ? "Menyimpan..." : "Simpan Verifikasi"}
                        </Button>
                        {verifiedDocuments.some(doc => doc.verification_status === "perlu_perbaikan") && (
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => openActionDialog(selectedService, "return")}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Kembalikan Usulan
                          </Button>
                        )}
                        {verifiedDocuments.every(doc => doc.verification_status === "sudah_sesuai") && (
                          <Button
                            className="flex-1"
                            onClick={() => openActionDialog(selectedService, "approve")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Setujui Usulan
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada dokumen yang dilampirkan</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Setujui Usulan" : "Kembalikan Usulan"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Anda akan menyetujui usulan ini. Usulan akan dilanjutkan ke tahap berikutnya."
                : "Usulan akan dikembalikan untuk revisi. Mohon berikan alasan pengembalian."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="action-note">
                {actionType === "approve" ? "Catatan (Opsional)" : "Alasan Pengembalian *"}
              </Label>
              <Textarea
                id="action-note"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Tambahkan catatan untuk persetujuan..."
                    : "Jelaskan alasan pengembalian usulan..."
                }
                rows={4}
                required={actionType === "return"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={actionType === "approve" ? handleApprove : handleReturn}
              isLoading={isSubmitting}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              {actionType === "approve"
                ? "Setujui"
                : "Kembalikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

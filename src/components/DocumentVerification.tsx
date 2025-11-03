import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";

export type DocumentVerificationStatus = "menunggu_review" | "sudah_sesuai" | "perlu_perbaikan";

export interface VerifiedDocument {
  name: string;
  url: string;
  note?: string;
  verification_status?: DocumentVerificationStatus;
  verification_note?: string;
}

interface DocumentVerificationProps {
  documents: VerifiedDocument[];
  onUpdate: (documents: VerifiedDocument[]) => void;
  readOnly?: boolean;
}

const statusConfig = {
  menunggu_review: {
    label: "Menunggu Review",
    color: "bg-yellow-500",
    icon: Clock,
  },
  sudah_sesuai: {
    label: "Sudah Sesuai",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  perlu_perbaikan: {
    label: "Perlu Perbaikan",
    color: "bg-red-500",
    icon: AlertCircle,
  },
};

export function DocumentVerification({ documents, onUpdate, readOnly = false }: DocumentVerificationProps) {
  const [localDocuments, setLocalDocuments] = useState<VerifiedDocument[]>(
    documents.map(doc => ({
      ...doc,
      verification_status: doc.verification_status || "menunggu_review",
      verification_note: doc.verification_note || "",
    }))
  );

  const handleStatusChange = (index: number, status: DocumentVerificationStatus) => {
    const updated = [...localDocuments];
    updated[index].verification_status = status;
    setLocalDocuments(updated);
    onUpdate(updated);
  };

  const handleNoteChange = (index: number, note: string) => {
    const updated = [...localDocuments];
    updated[index].verification_note = note;
    setLocalDocuments(updated);
    onUpdate(updated);
  };

  const getStatusBadge = (status: DocumentVerificationStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getVerificationSummary = () => {
    const total = localDocuments.length;
    const sesuai = localDocuments.filter(d => d.verification_status === "sudah_sesuai").length;
    const perluPerbaikan = localDocuments.filter(d => d.verification_status === "perlu_perbaikan").length;
    const menunggu = localDocuments.filter(d => d.verification_status === "menunggu_review").length;

    return { total, sesuai, perluPerbaikan, menunggu };
  };

  const summary = getVerificationSummary();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ringkasan Verifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="font-bold text-lg">{summary.total}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sesuai</div>
              <div className="font-bold text-lg text-green-600">{summary.sesuai}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Perlu Perbaikan</div>
              <div className="font-bold text-lg text-red-600">{summary.perluPerbaikan}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Menunggu</div>
              <div className="font-bold text-lg text-yellow-600">{summary.menunggu}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {localDocuments.map((doc, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium">{doc.name}</CardTitle>
                  {doc.note && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {doc.note}
                    </p>
                  )}
                </div>
                {getStatusBadge(doc.verification_status || "menunggu_review")}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(doc.url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Dokumen
                </Button>
              </div>

              {!readOnly && (
                <>
                  <div>
                    <Label className="text-xs">Status Verifikasi</Label>
                    <Select
                      value={doc.verification_status || "menunggu_review"}
                      onValueChange={(value) => handleStatusChange(index, value as DocumentVerificationStatus)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="menunggu_review">Menunggu Review</SelectItem>
                        <SelectItem value="sudah_sesuai">Sudah Sesuai</SelectItem>
                        <SelectItem value="perlu_perbaikan">Perlu Perbaikan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Catatan Verifikasi</Label>
                    <Textarea
                      value={doc.verification_note || ""}
                      onChange={(e) => handleNoteChange(index, e.target.value)}
                      placeholder="Berikan catatan spesifik untuk dokumen ini..."
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                </>
              )}

              {readOnly && doc.verification_note && (
                <div>
                  <Label className="text-xs">Catatan dari Admin</Label>
                  <div className="mt-1 p-2 bg-muted rounded-md text-sm">
                    {doc.verification_note}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

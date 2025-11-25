import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TrackingStatusDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: {
        status: string;
        description: string;
        evidenceLink: string;
    }) => void;
    isLoading: boolean;
}

const TRACKING_STATUS_OPTIONS = [
    "Diproses Biro OSDMA",
    "Diproses BKN",
    "Selesai - SK Terbit",
];

export function TrackingStatusDialog({
    open,
    onOpenChange,
    onSave,
    isLoading,
}: TrackingStatusDialogProps) {
    const [status, setStatus] = useState("");
    const [description, setDescription] = useState("");
    const [evidenceLink, setEvidenceLink] = useState("");

    const handleSubmit = () => {
        if (!status) return;
        onSave({ status, description, evidenceLink });
        // Reset form
        setStatus("");
        setDescription("");
        setEvidenceLink("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Status Tracking</DialogTitle>
                    <DialogDescription>
                        Perbarui status posisi berkas usulan. Status ini bersifat informatif
                        untuk pemohon.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Pilih status..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TRACKING_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Keterangan (Opsional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tambahkan keterangan detail..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="evidence">Link Bukti Dukung (Opsional)</Label>
                        <Input
                            id="evidence"
                            value={evidenceLink}
                            onChange={(e) => setEvidenceLink(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!status || isLoading}>
                        {isLoading ? "Menyimpan..." : "Simpan Status"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

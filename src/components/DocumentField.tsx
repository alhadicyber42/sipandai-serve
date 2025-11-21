import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Edit2, ExternalLink, Link as LinkIcon, Plus, Save, Trash2, X, FileText } from "lucide-react";
import { DocumentItem } from "@/contexts/AuthContext";
import { getServicesUsingDocument } from "@/lib/document-mapping";

interface DocumentFieldProps {
    doc: {
        id: string;
        label: string;
        allowMultiple?: boolean;
    };
    initialValue: string | string[] | DocumentItem | DocumentItem[];
    onSave: (id: string, value: DocumentItem | DocumentItem[]) => Promise<boolean>;
}

export function DocumentField({ doc, initialValue, onSave }: DocumentFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Helper to normalize initial value to DocumentItem or DocumentItem[]
    const normalizeValue = (val: string | string[] | DocumentItem | DocumentItem[]): DocumentItem | DocumentItem[] => {
        if (doc.allowMultiple) {
            if (Array.isArray(val)) {
                return val.map((v, idx) => {
                    if (typeof v === 'string') return { name: `${doc.label} ${idx + 1}`, url: v };
                    return v;
                });
            }
            if (typeof val === 'string' && val) return [{ name: `${doc.label} 1`, url: val }];
            if (typeof val === 'object' && val !== null && 'url' in val) return [val as DocumentItem];
            return [];
        } else {
            if (Array.isArray(val)) {
                const first = val[0];
                if (typeof first === 'string') return { name: doc.label, url: first };
                if (first) return first;
                return { name: doc.label, url: "" };
            }
            if (typeof val === 'string') return { name: doc.label, url: val };
            if (val) return val as DocumentItem;
            return { name: doc.label, url: "" };
        }
    };

    const [value, setValue] = useState<DocumentItem | DocumentItem[]>(normalizeValue(initialValue));

    const handleEdit = () => {
        setIsEditing(true);
        setValue(normalizeValue(initialValue));
    };

    const handleCancel = () => {
        setIsEditing(false);
        setValue(normalizeValue(initialValue));
    };

    const handleSave = async () => {
        setIsSaving(true);

        let valueToSave: DocumentItem | DocumentItem[];

        if (Array.isArray(value)) {
            // Filter out empty URLs
            valueToSave = value.filter(v => v.url.trim() !== "");
        } else {
            valueToSave = value;
            if ((valueToSave as DocumentItem).url.trim() === "") {
                // If single value and empty, maybe we want to save it as empty or null? 
                // But the type expects DocumentItem. Let's keep it as is, but maybe the parent handles it?
                // Actually, if url is empty, it effectively means "no document".
            }
        }

        const success = await onSave(doc.id, valueToSave);
        if (success) {
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const handleDelete = async () => {
        if (confirm(`Apakah Anda yakin ingin menghapus ${doc.label}?`)) {
            setIsSaving(true);
            const emptyValue = doc.allowMultiple ? [] : { name: doc.label, url: "" };
            const success = await onSave(doc.id, emptyValue);
            if (success) {
                setValue(emptyValue);
            }
            setIsSaving(false);
        }
    };

    // Multi-value handlers
    const handleMultiChange = (index: number, field: keyof DocumentItem, val: string) => {
        if (Array.isArray(value)) {
            const newValue = [...value];
            newValue[index] = { ...newValue[index], [field]: val };
            setValue(newValue);
        }
    };

    const addMultiField = () => {
        if (Array.isArray(value)) {
            setValue([...value, { name: `${doc.label} ${value.length + 1}`, url: "" }]);
        } else {
            setValue([{ name: `${doc.label} 1`, url: "" }]);
        }
    };

    const removeMultiField = (index: number) => {
        if (Array.isArray(value)) {
            const newValue = [...value];
            newValue.splice(index, 1);
            setValue(newValue);
        }
    };

    // Single-value handler
    const handleSingleChange = (field: keyof DocumentItem, val: string) => {
        if (!Array.isArray(value)) {
            setValue({ ...value, [field]: val });
        }
    };

    const hasValue = Array.isArray(value)
        ? value.some(v => v.url.trim() !== "")
        : (value as DocumentItem).url.trim() !== "";

    if (isEditing) {
        return (
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold">{doc.label}</Label>
                </div>

                {doc.allowMultiple ? (
                    <div className="space-y-4">
                        {(Array.isArray(value) ? value : []).map((val, idx) => (
                            <div key={idx} className="flex gap-2 items-start p-3 bg-background rounded-md border">
                                <div className="flex-1 space-y-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Nama Dokumen</Label>
                                        <Input
                                            value={val.name}
                                            onChange={(e) => handleMultiChange(idx, 'name', e.target.value)}
                                            placeholder="Contoh: SK Pangkat II/a"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Link URL</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                value={val.url}
                                                onChange={(e) => handleMultiChange(idx, 'url', e.target.value)}
                                                placeholder="https://..."
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => removeMultiField(idx)} className="text-destructive mt-6">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addMultiField} className="w-full border-dashed">
                            <Plus className="h-4 w-4 mr-2" /> Tambah Dokumen
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nama Dokumen</Label>
                            <Input
                                value={(value as DocumentItem).name}
                                onChange={(e) => handleSingleChange('name', e.target.value)}
                                placeholder={`Contoh: ${doc.label}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Link URL</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={(value as DocumentItem).url}
                                    onChange={(e) => handleSingleChange('url', e.target.value)}
                                    placeholder="https://..."
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" /> Batal
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan</>}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg hover:bg-muted/20 transition-colors group">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Label className="text-base font-medium cursor-pointer" onClick={handleEdit}>{doc.label}</Label>
                        {hasValue && <CheckCircle2 className="h-4 w-4 text-success" />}

                        {/* Service badges */}
                        <div className="flex items-center gap-1 ml-2">
                            {getServicesUsingDocument(doc.id).map((serviceInfo) => (
                                <Badge
                                    key={serviceInfo.service}
                                    variant="secondary"
                                    className={`text-[10px] px-1.5 py-0 h-5 ${serviceInfo.color === 'green'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : serviceInfo.color === 'teal'
                                                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        }`}
                                    title={`Digunakan untuk layanan ${serviceInfo.service === 'kenaikan_pangkat' ? 'Kenaikan Pangkat' : serviceInfo.service === 'mutasi' ? 'Mutasi' : 'Pensiun'}`}
                                >
                                    {serviceInfo.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {hasValue ? (
                        <div className="space-y-2 mt-2">
                            {doc.allowMultiple && Array.isArray(value) ? (
                                value.map((val, idx) => (
                                    val.url.trim() !== "" && (
                                        <a
                                            key={idx}
                                            href={val.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-primary hover:underline group/link"
                                        >
                                            <FileText className="h-3 w-3" />
                                            <span className="font-medium">{val.name || val.url}</span>
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </a>
                                    )
                                ))
                            ) : (
                                (value as DocumentItem).url.trim() !== "" && (
                                    <a
                                        href={(value as DocumentItem).url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-primary hover:underline group/link"
                                    >
                                        <FileText className="h-3 w-3" />
                                        <span className="font-medium">{(value as DocumentItem).name || (value as DocumentItem).url}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                    </a>
                                )
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Belum ada dokumen</p>
                    )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={handleEdit} title="Edit">
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    {hasValue && (
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive" title="Hapus">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

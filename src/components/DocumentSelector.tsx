import { useMemo, useState } from "react";
import { useAuth, DocumentItem } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Database, Plus } from "lucide-react";

interface DocumentSelectorProps {
    label: string;
    repositoryId: string;
    value: string; // URL
    onChange: (url: string) => void;
    note?: string;
    required?: boolean;
}

export function DocumentSelector({
    label,
    repositoryId,
    value,
    onChange,
    note,
    required = false,
}: DocumentSelectorProps) {
    const { user } = useAuth();
    const [mode, setMode] = useState<"select" | "new">(value ? "new" : "select");

    // Get available documents from repository
    const availableDocs = useMemo(() => {
        if (!user?.documents || !repositoryId) return [];

        const doc = user.documents[repositoryId];
        if (!doc) return [];

        // Normalize to array of DocumentItem
        if (Array.isArray(doc)) {
            return doc.map((d) =>
                typeof d === "string" ? { name: repositoryId, url: d } : d
            );
        } else if (typeof doc === "string") {
            return [{ name: repositoryId, url: doc }];
        } else {
            return [doc as DocumentItem];
        }
    }, [user?.documents, repositoryId]);

    const hasRepository = availableDocs.length > 0;

    return (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <Label className="text-base font-medium">
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
                </div>
                {hasRepository && (
                    <Badge variant="secondary" className="gap-1">
                        <Database className="h-3 w-3" />
                        {availableDocs.length}
                    </Badge>
                )}
            </div>

            {hasRepository && (
                <>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            type="button"
                            variant={mode === "select" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode("select")}
                            className="flex-1"
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Pilih dari Repository
                        </Button>
                        <Button
                            type="button"
                            variant={mode === "new" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setMode("new")}
                            className="flex-1"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Link Baru
                        </Button>
                    </div>

                    {mode === "select" && (
                        <div className="space-y-2">
                            <Select value={value} onValueChange={onChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih dokumen dari repository..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDocs.map((doc, idx) => (
                                        <SelectItem key={idx} value={doc.url}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{doc.name}</span>
                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {value && (
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Buka link
                                </a>
                            )}
                        </div>
                    )}
                </>
            )}

            {(mode === "new" || !hasRepository) && (
                <div className="space-y-2">
                    {hasRepository && (
                        <p className="text-sm text-muted-foreground">
                            Masukkan link baru (akan otomatis tersimpan ke Repository):
                        </p>
                    )}
                    <div className="relative">
                        <Input
                            type="url"
                            placeholder="https://drive.google.com/..."
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="pr-10"
                        />
                        {value && (
                            <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute right-3 top-2.5 text-primary hover:text-primary/80"
                                title="Buka link"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

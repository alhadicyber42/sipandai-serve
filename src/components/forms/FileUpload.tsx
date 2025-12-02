import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
    accept?: string;
    maxSize?: number; // in MB
    maxFiles?: number;
    onFilesChange: (files: File[]) => void;
    value?: File[];
    error?: string;
    hint?: string;
}

export function FileUpload({
    accept = "*/*",
    maxSize = 5,
    maxFiles = 1,
    onFilesChange,
    value = [],
    error,
    hint,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState<File[]>(value);
    const [uploadError, setUploadError] = useState<string>("");

    const handleFiles = useCallback(
        (newFiles: FileList | null) => {
            if (!newFiles) return;

            setUploadError("");
            const fileArray = Array.from(newFiles);

            // Check max files
            if (files.length + fileArray.length > maxFiles) {
                setUploadError(`Maksimal ${maxFiles} file`);
                return;
            }

            // Check file sizes
            const oversizedFiles = fileArray.filter(
                (file) => file.size > maxSize * 1024 * 1024
            );
            if (oversizedFiles.length > 0) {
                setUploadError(`Ukuran file maksimal ${maxSize}MB`);
                return;
            }

            const updatedFiles = [...files, ...fileArray];
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        },
        [files, maxFiles, maxSize, onFilesChange]
    );

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
        },
        [handleFiles]
    );

    const removeFile = useCallback(
        (index: number) => {
            const updatedFiles = files.filter((_, i) => i !== index);
            setFiles(updatedFiles);
            onFilesChange(updatedFiles);
        },
        [files, onFilesChange]
    );

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) {
            return <ImageIcon className="h-8 w-8 text-primary" />;
        }
        return <FileText className="h-8 w-8 text-primary" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    const showError = error || uploadError;

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors cursor-pointer",
                    dragActive && "border-primary bg-primary/5",
                    showError && "border-destructive"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <CardContent className="p-6">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                        <Upload className={cn(
                            "h-12 w-12 mb-4",
                            dragActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        <p className="text-sm font-medium mb-1">
                            Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {accept === "*/*" ? "Semua jenis file" : accept.replace(/\./g, "").toUpperCase()}
                            {" • "}
                            Maksimal {maxSize}MB
                            {maxFiles > 1 && ` • ${maxFiles} file`}
                        </p>
                        <input
                            type="file"
                            className="hidden"
                            accept={accept}
                            multiple={maxFiles > 1}
                            onChange={handleChange}
                        />
                    </label>
                </CardContent>
            </Card>

            {/* File Preview */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    {getFileIcon(file)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </p>
                                    </div>
                                    {file.type.startsWith("image/") && (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                            className="h-16 w-16 object-cover rounded"
                                        />
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFile(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Hint or Error */}
            {hint && !showError && (
                <p className="text-sm text-muted-foreground">{hint}</p>
            )}
            {showError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                    <span className="text-base">⚠</span>
                    {showError}
                </p>
            )}
        </div>
    );
}

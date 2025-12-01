import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Upload, X, Download, AlertCircle } from "lucide-react";
import { fileToBase64, validateDocxTemplate } from "@/lib/docxEngine";
import { toast } from "sonner";

interface TemplateUploaderProps {
    onFileSelect: (file: File, base64: string) => void;
    currentFileName?: string;
    currentFileContent?: string;
}

export function TemplateUploader({
    onFileSelect,
    currentFileName,
    currentFileContent
}: TemplateUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState<string | undefined>(currentFileName);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndProcessFile = async (file: File) => {
        setError(null);

        if (!validateDocxTemplate(file)) {
            setError("Format file tidak valid. Harap upload file Microsoft Word (.docx)");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setError("Ukuran file terlalu besar. Maksimal 5MB.");
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            setFileName(file.name);
            onFileSelect(file, base64);
            toast.success("File template berhasil diupload");
        } catch (err) {
            console.error(err);
            setError("Gagal memproses file.");
            toast.error("Gagal memproses file");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndProcessFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setFileName(undefined);
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        // We might want to notify parent to clear file, but for now just UI
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <Label>Upload Template (.docx)</Label>

                {!fileName ? (
                    <div
                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Microsoft Word (.docx) (MAX. 5MB)
                            </p>
                        </div>
                        <Input
                            ref={inputRef}
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleChange}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
                                    {fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Siap digunakan
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveFile}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Panduan Template</AlertTitle>
                <AlertDescription className="text-sm mt-2">
                    <p className="mb-2">
                        Pastikan file Word Anda mengandung variabel dengan format <code>{"{{nama_variabel}}"}</code>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                            <strong>Data Pegawai:</strong>
                            <ul className="list-disc list-inside pl-1 text-muted-foreground">
                                <li>{"{{nama_pegawai}}"}</li>
                                <li>{"{{nip}}"}</li>
                                <li>{"{{jabatan}}"}</li>
                                <li>{"{{pangkat}}"}</li>
                            </ul>
                        </div>
                        <div>
                            <strong>Data Cuti:</strong>
                            <ul className="list-disc list-inside pl-1 text-muted-foreground">
                                <li>{"{{jenis_cuti}}"}</li>
                                <li>{"{{tanggal_mulai}}"}</li>
                                <li>{"{{tanggal_selesai}}"}</li>
                                <li>{"{{total_hari}}"}</li>
                            </ul>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </div>
    );
}

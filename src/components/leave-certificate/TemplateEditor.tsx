/**
 * Template Editor Component
 * Rich text editor for creating and editing leave certificate templates
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { VariableSelector } from "./VariableSelector";
import { TemplatePreview } from "./TemplatePreview";
import { validateTemplate, getSampleTemplateData } from "@/lib/templateEngine";
import { AlertCircle, Eye, EyeOff, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TemplateEditorProps {
    initialContent?: string;
    onChange: (content: string) => void;
    showPreview?: boolean;
}

export const TemplateEditor = ({
    initialContent = "",
    onChange,
    showPreview = true
}: TemplateEditorProps) => {
    const [content, setContent] = useState(initialContent);
    const [showValidation, setShowValidation] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = useState<string>("editor");

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        onChange(newContent);
    };

    const handleInsertVariable = (variable: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = content.substring(0, start) + variable + content.substring(end);

        handleContentChange(newContent);

        // Set cursor position after inserted variable
        setTimeout(() => {
            textarea.focus();
            const newPosition = start + variable.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    const validation = validateTemplate(content);
    const sampleData = getSampleTemplateData();

    return (
        <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="editor" className="gap-2">
                            <Code className="h-4 w-4" />
                            Editor
                        </TabsTrigger>
                        {showPreview && (
                            <TabsTrigger value="preview" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <div className="flex gap-2">
                        <VariableSelector onInsert={handleInsertVariable} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowValidation(!showValidation)}
                            className="gap-2"
                        >
                            {showValidation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            {showValidation ? "Sembunyikan" : "Validasi"}
                        </Button>
                    </div>
                </div>

                <TabsContent value="editor" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Konten Template</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="template-content">
                                    Tulis template surat keterangan cuti Anda di bawah ini
                                </Label>
                                <Textarea
                                    ref={textareaRef}
                                    id="template-content"
                                    value={content}
                                    onChange={(e) => handleContentChange(e.target.value)}
                                    placeholder="Ketik template surat di sini... Gunakan tombol 'Insert Variabel' untuk menambahkan variabel yang akan otomatis diganti dengan data sebenarnya."
                                    className="min-h-[500px] font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Gunakan format <code className="bg-muted px-1 py-0.5 rounded">{"{{nama_variabel}}"}</code> untuk variabel yang akan diganti otomatis.
                                    Klik tombol "Insert Variabel" untuk melihat daftar variabel yang tersedia.
                                </p>
                            </div>

                            {/* Validation Messages */}
                            {showValidation && (
                                <div className="space-y-2">
                                    {!validation.isValid && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Variabel wajib yang hilang:</strong>
                                                <ul className="list-disc list-inside mt-1">
                                                    {validation.missingRequired.map((v) => (
                                                        <li key={v}>
                                                            <code className="bg-destructive/20 px-1 py-0.5 rounded">{"{{" + v + "}}"}</code>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {validation.isValid && validation.warnings.length > 0 && (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Peringatan:</strong>
                                                <ul className="list-disc list-inside mt-1">
                                                    {validation.warnings.map((w, i) => (
                                                        <li key={i} className="text-sm">{w}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {validation.isValid && validation.warnings.length === 0 && (
                                        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                            <AlertCircle className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-800 dark:text-green-200">
                                                Template valid! Semua variabel wajib sudah ada.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {showPreview && (
                    <TabsContent value="preview" className="mt-0">
                        <TemplatePreview
                            template={content}
                            data={sampleData}
                            title="Preview dengan Data Contoh"
                            showActions={false}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Preview ini menggunakan data contoh. Data sebenarnya akan digunakan saat generate surat keterangan dari usulan cuti yang disetujui.
                        </p>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

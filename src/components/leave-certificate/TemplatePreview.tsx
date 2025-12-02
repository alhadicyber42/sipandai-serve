/**
 * Template Preview Component
 * Shows template with variables replaced by actual or sample data
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { replaceVariables } from "@/lib/templateEngine";
import { TemplateData } from "@/types/leave-certificate";

interface TemplatePreviewProps {
    template: string;
    data: Partial<TemplateData>;
    title?: string;
    showActions?: boolean;
}

export const TemplatePreview = ({
    template,
    data,
    title = "Preview Surat Keterangan",
    showActions = true
}: TemplatePreviewProps) => {
    const processedContent = replaceVariables(template, data);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Sanitize content to prevent XSS
        const sanitizedContent = processedContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Use safer method than document.write
        printWindow.document.open();
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Keterangan Cuti</title>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'unsafe-inline';">
          <style>
            @media print {
              @page {
                margin: 2cm;
              }
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.6;
              max-width: 21cm;
              margin: 0 auto;
              padding: 2cm;
            }
            pre {
              font-family: 'Times New Roman', Times, serif;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <pre>${sanitizedContent}</pre>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    };

    const handleDownload = () => {
        const blob = new Blob([processedContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `surat-keterangan-cuti-${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    {showActions && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-white dark:bg-slate-950 border rounded-lg p-6 min-h-[400px]">
                    <pre className="font-serif text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {processedContent}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Variable Preview Component
 * Shows preview of variable data before generating letter
 */

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    TEMPLATE_VARIABLES,
    VARIABLE_CATEGORIES,
    VARIABLE_CATEGORY_COLORS,
    VariableCategory,
    getVariableByKey,
    parseTemplateVariables,
    getBaseVariableKey
} from "@/lib/templateVariables";

interface VariablePreviewProps {
    data: Record<string, string>;
    templateContent?: string;
    title?: string;
}

export default function VariablePreview({ data, templateContent, title = "Preview Data Variabel" }: VariablePreviewProps) {
    // Parse template to find required variables
    const templateVariables = useMemo(() => {
        if (!templateContent) return [];
        return parseTemplateVariables(templateContent);
    }, [templateContent]);

    // Analyze which variables are filled, missing, or extra
    const analysis = useMemo(() => {
        const filled: { key: string; value: string; label: string; category: VariableCategory }[] = [];
        const missing: { key: string; label: string; category: VariableCategory }[] = [];
        const extra: { key: string; value: string }[] = [];

        // Check all data entries
        Object.entries(data).forEach(([key, value]) => {
            const variable = getVariableByKey(key);
            if (variable) {
                filled.push({
                    key,
                    value: value || '-',
                    label: variable.label,
                    category: variable.category
                });
            } else {
                extra.push({ key, value: value || '-' });
            }
        });

        // Check template variables to find missing ones
        if (templateVariables.length > 0) {
            templateVariables.forEach(varKey => {
                const baseKey = getBaseVariableKey(varKey);
                if (!data[varKey] && !data[baseKey]) {
                    const variable = getVariableByKey(baseKey);
                    if (variable && !filled.some(f => f.key === varKey || f.key === baseKey)) {
                        missing.push({
                            key: varKey,
                            label: variable.label,
                            category: variable.category
                        });
                    }
                }
            });
        }

        return { filled, missing, extra };
    }, [data, templateVariables]);

    // Group filled variables by category
    const groupedFilled = useMemo(() => {
        const groups: Record<VariableCategory, typeof analysis.filled> = {
            pegawai: [],
            cuti: [],
            kenaikan_pangkat: [],
            pensiun: [],
            mutasi: [],
            unit: [],
            tanggal: [],
            custom: []
        };

        analysis.filled.forEach(item => {
            groups[item.category].push(item);
        });

        return groups;
    }, [analysis.filled]);

    const categories = Object.keys(VARIABLE_CATEGORIES) as VariableCategory[];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {analysis.filled.length} Terisi
                        </Badge>
                        {analysis.missing.length > 0 && (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {analysis.missing.length} Kosong
                            </Badge>
                        )}
                    </div>
                </div>
                <CardDescription>
                    Data variabel yang akan diisi ke dalam template
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Missing variables warning */}
                {analysis.missing.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <span className="font-medium">Variabel berikut tidak memiliki data:</span>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {analysis.missing.map(item => (
                                    <Badge key={item.key} variant="outline" className="text-xs">
                                        {`{${item.key}}`} - {item.label}
                                    </Badge>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Filled variables table */}
                <ScrollArea className="h-[300px] border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Variabel</TableHead>
                                <TableHead className="w-[150px]">Label</TableHead>
                                <TableHead>Nilai</TableHead>
                                <TableHead className="w-[120px]">Kategori</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map(category => {
                                const items = groupedFilled[category];
                                if (items.length === 0) return null;
                                
                                return items.map((item, index) => (
                                    <TableRow key={item.key}>
                                        <TableCell>
                                            <code className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono">
                                                {`{${item.key}}`}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-sm">{item.label}</TableCell>
                                        <TableCell className="font-medium">
                                            {item.value || <span className="text-muted-foreground italic">-</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="secondary" 
                                                className={`text-xs ${VARIABLE_CATEGORY_COLORS[item.category]}`}
                                            >
                                                {VARIABLE_CATEGORIES[item.category].replace('Data ', '')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ));
                            })}
                            
                            {/* Extra variables (not in standard list) */}
                            {analysis.extra.map(item => (
                                <TableRow key={item.key} className="bg-muted/30">
                                    <TableCell>
                                        <code className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded text-xs font-mono">
                                            {`{${item.key}}`}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground italic">Kustom</TableCell>
                                    <TableCell className="font-medium">{item.value}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            Kustom
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>

                {analysis.filled.length === 0 && analysis.extra.length === 0 && (
                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="text-muted-foreground mt-2">
                            Tidak ada data variabel untuk ditampilkan
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

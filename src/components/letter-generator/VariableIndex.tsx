/**
 * Variable Index Component
 * Displays all available template variables with copy functionality
 */

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Copy, 
    Check, 
    Search, 
    Info,
    User,
    Calendar,
    Building2,
    FileText,
    ArrowUpRight,
    Clock,
    Briefcase
} from "lucide-react";
import { toast } from "sonner";
import {
    TEMPLATE_VARIABLES,
    VARIABLE_CATEGORIES,
    VARIABLE_CATEGORY_COLORS,
    VariableCategory,
    formatVariable,
    generateIndexedVariables,
    ExtendedTemplateVariable
} from "@/lib/templateVariables";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Icons for each category
const CATEGORY_ICONS: Record<VariableCategory, React.ReactNode> = {
    pegawai: <User className="h-4 w-4" />,
    cuti: <Calendar className="h-4 w-4" />,
    kenaikan_pangkat: <ArrowUpRight className="h-4 w-4" />,
    pensiun: <Clock className="h-4 w-4" />,
    mutasi: <Briefcase className="h-4 w-4" />,
    unit: <Building2 className="h-4 w-4" />,
    tanggal: <Calendar className="h-4 w-4" />,
    custom: <FileText className="h-4 w-4" />
};

interface VariableIndexProps {
    onSelectVariable?: (variable: string) => void;
}

export default function VariableIndex({ onSelectVariable }: VariableIndexProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<VariableCategory | "all">("all");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());

    // Filter variables based on search and category
    const filteredVariables = useMemo(() => {
        let variables = TEMPLATE_VARIABLES;
        
        // Filter by category
        if (selectedCategory !== "all") {
            variables = variables.filter(v => v.category === selectedCategory);
        }
        
        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            variables = variables.filter(v => 
                v.key.toLowerCase().includes(query) ||
                v.label.toLowerCase().includes(query) ||
                v.description.toLowerCase().includes(query)
            );
        }
        
        return variables;
    }, [searchQuery, selectedCategory]);

    // Group variables by category
    const groupedVariables = useMemo(() => {
        const groups: Record<VariableCategory, ExtendedTemplateVariable[]> = {
            pegawai: [],
            cuti: [],
            kenaikan_pangkat: [],
            pensiun: [],
            mutasi: [],
            unit: [],
            tanggal: [],
            custom: []
        };
        
        filteredVariables.forEach(v => {
            groups[v.category].push(v);
        });
        
        return groups;
    }, [filteredVariables]);

    // Copy variable to clipboard
    const handleCopyVariable = useCallback((variable: string, index?: number) => {
        const formattedVariable = formatVariable(variable, index);
        navigator.clipboard.writeText(formattedVariable);
        setCopiedKey(`${variable}${index !== undefined ? `_${index}` : ''}`);
        toast.success(`Variabel ${formattedVariable} disalin ke clipboard`);
        
        if (onSelectVariable) {
            onSelectVariable(formattedVariable);
        }
        
        setTimeout(() => setCopiedKey(null), 2000);
    }, [onSelectVariable]);

    // Toggle expanded state for indexed variables
    const toggleExpanded = useCallback((key: string) => {
        setExpandedVariables(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    }, []);

    // Render a single variable row
    const renderVariableRow = (variable: ExtendedTemplateVariable) => {
        const isCopied = copiedKey === variable.key;
        const isExpanded = expandedVariables.has(variable.key);
        
        return (
            <div key={variable.key} className="border-b last:border-0">
                <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <code className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-mono">
                                {`{${variable.key}}`}
                            </code>
                            <span className="font-medium text-sm">{variable.label}</span>
                            {variable.isIndexed && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => toggleExpanded(variable.key)}>
                                                Bertingkat
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Mendukung variabel bertingkat seperti {`{${variable.key}_1}, {${variable.key}_2}`} dst.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
                        <p className="text-xs text-primary/70 mt-0.5">Contoh: {variable.example}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyVariable(variable.key)}
                            className="h-8 px-2"
                        >
                            {isCopied ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
                
                {/* Indexed variables expansion */}
                {variable.isIndexed && isExpanded && (
                    <div className="bg-muted/30 p-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                            Klik untuk menyalin variabel bertingkat:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(index => {
                                const indexedKey = `${variable.key}_${index}`;
                                const isIndexedCopied = copiedKey === indexedKey;
                                return (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyVariable(variable.key, index)}
                                        className="h-7 text-xs font-mono"
                                    >
                                        {`{${indexedKey}}`}
                                        {isIndexedCopied && <Check className="h-3 w-3 ml-1 text-green-500" />}
                                    </Button>
                                );
                            })}
                            <span className="text-xs text-muted-foreground self-center">... dst</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render category section
    const renderCategorySection = (category: VariableCategory) => {
        const variables = groupedVariables[category];
        if (variables.length === 0) return null;
        
        return (
            <Card key={category} className="mb-4">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${VARIABLE_CATEGORY_COLORS[category]}`}>
                            {CATEGORY_ICONS[category]}
                        </div>
                        <CardTitle className="text-base">{VARIABLE_CATEGORIES[category]}</CardTitle>
                        <Badge variant="secondary" className="ml-auto">{variables.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {variables.map(renderVariableRow)}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const categories = Object.keys(VARIABLE_CATEGORIES) as VariableCategory[];

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Index Variabel Template
                    </CardTitle>
                    <CardDescription>
                        Daftar semua variabel yang tersedia untuk digunakan dalam template surat. 
                        Klik tombol copy untuk menyalin variabel ke clipboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Cari variabel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Category Tabs */}
                    <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as VariableCategory | "all")}>
                        <TabsList className="flex flex-wrap h-auto gap-1">
                            <TabsTrigger value="all" className="text-xs">
                                Semua ({TEMPLATE_VARIABLES.length})
                            </TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger 
                                    key={cat} 
                                    value={cat} 
                                    className="text-xs flex items-center gap-1"
                                >
                                    {CATEGORY_ICONS[cat]}
                                    <span className="hidden sm:inline">{VARIABLE_CATEGORIES[cat]}</span>
                                    <span className="sm:hidden">{VARIABLE_CATEGORIES[cat].split(' ')[1] || VARIABLE_CATEGORIES[cat].split(' ')[0]}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                    
                    {/* Variable Syntax Info */}
                    <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Panduan Penggunaan Variabel
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Gunakan format <code className="bg-background px-1 rounded">{`{nama_variabel}`}</code> dalam template dokumen</li>
                            <li>Variabel bertingkat: <code className="bg-background px-1 rounded">{`{nama}_1, {nama}_2, {nama}_3`}</code> dst. untuk data berulang</li>
                            <li>Variabel yang tidak ditemukan akan tetap ditampilkan apa adanya</li>
                            <li>Pastikan nama variabel sesuai (case-sensitive)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Variables List */}
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
                {selectedCategory === "all" ? (
                    categories.map(renderCategorySection)
                ) : (
                    renderCategorySection(selectedCategory)
                )}
                
                {filteredVariables.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="text-muted-foreground mt-2">
                            Tidak ada variabel yang sesuai dengan pencarian
                        </p>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

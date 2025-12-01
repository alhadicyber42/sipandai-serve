/**
 * Variable Selector Component
 * Allows users to select and insert template variables
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TEMPLATE_VARIABLES, VARIABLE_CATEGORIES } from "@/lib/templateVariables";
import { TemplateVariable } from "@/types/leave-certificate";
import { Code, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariableSelectorProps {
    onInsert: (variable: string) => void;
    trigger?: React.ReactNode;
}

export const VariableSelector = ({ onInsert, trigger }: VariableSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<TemplateVariable['category'] | 'all'>('all');

    const filteredVariables = TEMPLATE_VARIABLES.filter(v => {
        const matchesSearch = v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.key.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleInsert = (key: string) => {
        onInsert(`{{${key}}}`);
        setOpen(false);
        setSearchQuery("");
    };

    const getCategoryColor = (category: TemplateVariable['category']) => {
        const colors = {
            employee: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
            leave: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
            unit: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
            date: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
        };
        return colors[category];
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Code className="h-4 w-4" />
                        Insert Variabel
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Pilih Variabel Template</DialogTitle>
                    <DialogDescription>
                        Pilih variabel yang akan dimasukkan ke dalam template. Variabel akan otomatis diganti dengan data sebenarnya.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari variabel..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                        >
                            Semua
                        </Button>
                        {Object.entries(VARIABLE_CATEGORIES).map(([key, label]) => (
                            <Button
                                key={key}
                                variant={selectedCategory === key ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(key as TemplateVariable['category'])}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>

                    {/* Variables List */}
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-2">
                            {filteredVariables.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Tidak ada variabel yang ditemukan
                                </div>
                            ) : (
                                filteredVariables.map((variable) => (
                                    <button
                                        key={variable.key}
                                        onClick={() => handleInsert(variable.key)}
                                        className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium">{variable.label}</span>
                                                    <Badge variant="secondary" className={cn("text-xs", getCategoryColor(variable.category))}>
                                                        {VARIABLE_CATEGORIES[variable.category]}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {variable.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                                        {`{{${variable.key}}}`}
                                                    </code>
                                                    <span className="text-xs text-muted-foreground">→</span>
                                                    <span className="text-xs text-muted-foreground italic">
                                                        {variable.example}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

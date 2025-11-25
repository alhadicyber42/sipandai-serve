import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { exportToExcel, exportToCSV } from "@/lib/export-helper";
import { cn } from "@/lib/utils";

interface ExportButtonProps<T> {
  data: T[];
  filename: string;
  formatter?: (data: T[]) => any[];
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  sheetName?: string;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  filename,
  formatter,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
  sheetName,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "excel" | "csv") => {
    if (data.length === 0) {
      return;
    }

    setIsExporting(true);

    try {
      const formattedData = formatter ? formatter(data) : data;

      if (format === "excel") {
        await exportToExcel(formattedData, { filename, sheetName });
      } else {
        await exportToCSV(formattedData, { filename });
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isEmpty || isExporting}
          className={cn("gap-2", className)}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Mengexport...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs">Export sebagai</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isEmpty || isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isEmpty || isExporting}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>CSV (.csv)</span>
        </DropdownMenuItem>
        {isEmpty && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
            Tidak ada data untuk diexport
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple export button without dropdown (direct Excel export)
interface SimpleExportButtonProps<T> {
  data: T[];
  filename: string;
  formatter?: (data: T[]) => any[];
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

export function SimpleExportButton<T extends Record<string, any>>({
  data,
  filename,
  formatter,
  disabled = false,
  variant = "outline",
  size = "default",
  className,
  children,
}: SimpleExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (data.length === 0) return;

    setIsExporting(true);
    try {
      const formattedData = formatter ? formatter(data) : data;
      await exportToExcel(formattedData, { filename });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = data.length === 0;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || isEmpty || isExporting}
      className={cn("gap-2", className)}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Mengexport...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {children || <span>Export Excel</span>}
        </>
      )}
    </Button>
  );
}

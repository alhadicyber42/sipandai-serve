import * as XLSX from "xlsx";
import { showToast } from "./toast-helper";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

/**
 * Export utilities for Excel and CSV
 */

interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Export data to Excel file
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) => {
  try {
    const {
      filename = "export",
      sheetName = "Data",
      includeTimestamp = true,
    } = options;

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const maxWidth = 50;
    const columns = Object.keys(data[0] || {});
    const colWidths = columns.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = includeTimestamp
      ? `_${format(new Date(), "yyyyMMdd_HHmmss")}`
      : "";
    const finalFilename = `${filename}${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    showToast.downloaded(finalFilename);
    return { success: true, filename: finalFilename };
  } catch (error: any) {
    console.error("Export to Excel failed:", error);
    showToast.error("Export gagal", {
      description: error.message || "Terjadi kesalahan saat export ke Excel",
    });
    return { success: false, error: error.message };
  }
};

/**
 * Export data to CSV file
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
) => {
  try {
    const {
      filename = "export",
      includeTimestamp = true,
    } = options;

    // Convert to CSV
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const timestamp = includeTimestamp
      ? `_${format(new Date(), "yyyyMMdd_HHmmss")}`
      : "";
    const finalFilename = `${filename}${timestamp}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast.downloaded(finalFilename);
    return { success: true, filename: finalFilename };
  } catch (error: any) {
    console.error("Export to CSV failed:", error);
    showToast.error("Export gagal", {
      description: error.message || "Terjadi kesalahan saat export ke CSV",
    });
    return { success: false, error: error.message };
  }
};

/**
 * Format service data for export
 */
export const formatServicesForExport = (services: any[]) => {
  return services.map((service, index) => ({
    No: index + 1,
    "Judul": service.title || "-",
    "Jenis Layanan": service.service_type || "-",
    "Status": service.status || "-",
    "Nama Pegawai": service.profiles?.name || "-",
    "Unit Kerja": service.work_units?.name || "-",
    "Tanggal Dibuat": service.created_at
      ? format(new Date(service.created_at), "dd MMMM yyyy HH:mm", { locale: localeId })
      : "-",
    "Tanggal Diupdate": service.updated_at
      ? format(new Date(service.updated_at), "dd MMMM yyyy HH:mm", { locale: localeId })
      : "-",
    "Catatan": service.notes || "-",
  }));
};

/**
 * Format consultation data for export
 */
export const formatConsultationsForExport = (consultations: any[]) => {
  return consultations.map((consultation, index) => ({
    No: index + 1,
    "Subjek": consultation.subject || "-",
    "Kategori": consultation.category || "-",
    "Status": consultation.status || "-",
    "Nama Pegawai": consultation.profiles?.name || "-",
    "Unit Kerja": consultation.work_units?.name || "-",
    "Pertanyaan": consultation.question || "-",
    "Tanggal Dibuat": consultation.created_at
      ? format(new Date(consultation.created_at), "dd MMMM yyyy HH:mm", { locale: localeId })
      : "-",
    "Tanggal Ditanggapi": consultation.responded_at
      ? format(new Date(consultation.responded_at), "dd MMMM yyyy HH:mm", { locale: localeId })
      : "Belum ditanggapi",
  }));
};

/**
 * Format employee data for export
 */
export const formatEmployeesForExport = (employees: any[]) => {
  return employees.map((employee, index) => ({
    No: index + 1,
    "Nama": employee.name || "-",
    "NIP": employee.nip || "-",
    "Email": employee.email || "-",
    "No. Telepon": employee.phone || "-",
    "Jabatan": employee.jabatan || "-",
    "Pangkat/Golongan": employee.pangkat_golongan || "-",
    "Unit Kerja": employee.work_units?.name || "-",
    "TMT PNS": employee.tmt_pns
      ? format(new Date(employee.tmt_pns), "dd MMMM yyyy", { locale: localeId })
      : "-",
    "TMT Pensiun": employee.tmt_pensiun
      ? format(new Date(employee.tmt_pensiun), "dd MMMM yyyy", { locale: localeId })
      : "-",
  }));
};

/**
 * Export multiple sheets to single Excel file
 */
export const exportMultipleSheets = (
  sheets: Array<{
    data: any[];
    sheetName: string;
    formatter?: (data: any[]) => any[];
  }>,
  filename: string = "export"
) => {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ data, sheetName, formatter }) => {
      const formattedData = formatter ? formatter(data) : data;
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Auto-size columns
      if (formattedData.length > 0) {
        const maxWidth = 50;
        const columns = Object.keys(formattedData[0] || {});
        const colWidths = columns.map((key) => {
          const maxLength = Math.max(
            key.length,
            ...formattedData.map((row) => String(row[key] || "").length)
          );
          return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet["!cols"] = colWidths;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, finalFilename);

    showToast.downloaded(finalFilename);
    return { success: true, filename: finalFilename };
  } catch (error: any) {
    console.error("Export multiple sheets failed:", error);
    showToast.error("Export gagal", {
      description: error.message || "Terjadi kesalahan saat export",
    });
    return { success: false, error: error.message };
  }
};

/**
 * Download file from URL with proper filename
 */
export const downloadFile = (url: string, filename?: string) => {
  try {
    const link = document.createElement("a");
    link.href = url;
    
    if (filename) {
      link.download = filename;
    }
    
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (filename) {
      showToast.downloaded(filename);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Download file failed:", error);
    showToast.error("Download gagal", {
      description: error.message || "Terjadi kesalahan saat download",
    });
    return { success: false, error: error.message };
  }
};

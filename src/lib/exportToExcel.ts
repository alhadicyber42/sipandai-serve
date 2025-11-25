import * as XLSX from "xlsx";
import { format } from "date-fns";

interface ExportService {
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    user_id: string;
    work_unit_id: number;
    service_type: string;
    profiles?: { name: string };
    work_units?: { name: string };
}

export function exportToExcel(services: ExportService[], filename: string = "usulan") {
    // Prepare data for export
    const exportData = services.map((service, index) => ({
        No: index + 1,
        "Judul Usulan": service.title,
        "Jenis Layanan": formatServiceType(service.service_type),
        Pemohon: service.profiles?.name || "-",
        "Unit Kerja": service.work_units?.name || "-",
        Status: formatStatus(service.status),
        "Tanggal Pengajuan": format(new Date(service.created_at), "dd/MM/yyyy HH:mm"),
        Keterangan: service.description || "-",
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
        { wch: 5 },  // No
        { wch: 40 }, // Judul Usulan
        { wch: 20 }, // Jenis Layanan
        { wch: 25 }, // Pemohon
        { wch: 30 }, // Unit Kerja
        { wch: 20 }, // Status
        { wch: 20 }, // Tanggal Pengajuan
        { wch: 40 }, // Keterangan
    ];
    ws["!cols"] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usulan");

    // Generate filename with timestamp
    const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, finalFilename);
}

function formatServiceType(type: string): string {
    const typeMap: Record<string, string> = {
        kenaikan_pangkat: "Kenaikan Pangkat",
        mutasi: "Mutasi",
        pensiun: "Pensiun",
        cuti: "Cuti",
    };
    return typeMap[type] || type;
}

function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        draft: "Draft",
        submitted: "Diajukan",
        approved_by_unit: "Disetujui Unit",
        approved_final: "Disetujui Final",
        returned_to_user: "Dikembalikan ke User",
        returned_to_unit: "Dikembalikan ke Unit",
        rejected: "Ditolak",
    };
    return statusMap[status] || status;
}

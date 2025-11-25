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
    notes?: any[];
    documents?: any[];
    profiles?: { name: string };
    work_units?: { name: string };
}

export function exportToExcel(services: ExportService[], filename: string = "usulan") {
    // Prepare main data
    const mainData = services.map((service, index) => {
        // Extract latest tracking status
        const trackingNotes = service.notes?.filter((note: any) => note.is_tracking_status) || [];
        const latestTracking = trackingNotes.length > 0
            ? trackingNotes[trackingNotes.length - 1].status_label
            : "-";

        // Extract all notes/comments
        const allNotes = service.notes
            ?.map((note: any) => {
                const timestamp = format(new Date(note.timestamp), "dd/MM/yyyy HH:mm");
                return `[${timestamp}] ${note.actor}: ${note.note}`;
            })
            .join("\n") || "-";

        // Extract document links with format: Name | Status | Link
        const documentLinks = service.documents
            ?.map((doc: any) => {
                const label = doc.label || doc.name || "Dokumen";
                const link = doc.link || doc.url || "-";
                const status = doc.verification_status || "belum_diverifikasi";
                return `${label} | ${formatVerificationStatus(status)} | ${link}`;
            })
            .join("\n") || "-";

        return {
            No: index + 1,
            "Judul Usulan": service.title,
            "Jenis Layanan": formatServiceType(service.service_type),
            Pemohon: service.profiles?.name || "-",
            "Unit Kerja": service.work_units?.name || "-",
            "Status Sistem": formatStatus(service.status),
            "Status Tracking": latestTracking,
            "Tanggal Pengajuan": format(new Date(service.created_at), "dd/MM/yyyy HH:mm"),
            Keterangan: service.description || "-",
            "Riwayat & Catatan": allNotes,
            "Lampiran Dokumen": documentLinks,
        };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(mainData);

    // Set column widths
    const colWidths = [
        { wch: 5 },  // No
        { wch: 40 }, // Judul Usulan
        { wch: 20 }, // Jenis Layanan
        { wch: 25 }, // Pemohon
        { wch: 30 }, // Unit Kerja
        { wch: 20 }, // Status Sistem
        { wch: 20 }, // Status Tracking
        { wch: 20 }, // Tanggal Pengajuan
        { wch: 40 }, // Keterangan
        { wch: 60 }, // Riwayat & Catatan
        { wch: 60 }, // Lampiran Dokumen
    ];
    ws["!cols"] = colWidths;

    // Enable text wrapping and convert URLs to hyperlinks
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            if (!ws[cellAddress].s) ws[cellAddress].s = {};
            ws[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };

            // Add hyperlinks to Lampiran Dokumen column (column K, index 10)
            if (C === 10 && R > 0) { // Skip header row
                const cellValue = ws[cellAddress].v;
                if (cellValue && typeof cellValue === 'string' && cellValue !== '-') {
                    // Extract first URL from the cell
                    const urlMatch = cellValue.match(/https?:\/\/[^\s|]+/);
                    if (urlMatch) {
                        ws[cellAddress].l = { Target: urlMatch[0], Tooltip: "Klik untuk membuka link" };
                        // Add blue color to indicate it's a link
                        if (!ws[cellAddress].s) ws[cellAddress].s = {};
                        ws[cellAddress].s.font = { color: { rgb: "0563C1" }, underline: true };
                    }
                }
            }
        }
    }

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

function formatVerificationStatus(status: string): string {
    const statusMap: Record<string, string> = {
        menunggu_review: "Menunggu Review",
        terverifikasi: "Terverifikasi",
        perlu_perbaikan: "Perlu Perbaikan",
        belum_diverifikasi: "Belum Diverifikasi",
    };
    return statusMap[status] || status;
}

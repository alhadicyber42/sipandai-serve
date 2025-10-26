import { storage } from "./storage";
import { SERVICE_STATUS, CONSULTATION_STATUS, USER_ROLES, LEAVE_TYPES } from "./constants";

export const initializeSeedData = () => {
  // Check if data already exists
  const existingUsers = storage.getUsers();
  if (existingUsers.length > 0) {
    return; // Data already seeded
  }

  // Create users
  const users = [
    {
      id: "1",
      name: "Administrator Pusat",
      email: "admin@sipandai.id",
      password: "admin123", // In production, this should be hashed
      role: USER_ROLES.ADMIN_PUSAT,
      work_unit_id: null,
      nip: "199001012020121001",
      phone: "081234567890",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Budi Santoso",
      email: "budi@bekasi.id",
      password: "user123",
      role: USER_ROLES.ADMIN_UNIT,
      work_unit_id: 8,
      nip: "199002012020121002",
      phone: "081234567891",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Siti Nurhaliza",
      email: "siti@bekasi.id",
      password: "user123",
      role: USER_ROLES.USER_UNIT,
      work_unit_id: 8,
      nip: "199003012020121003",
      phone: "081234567892",
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Ahmad Yani",
      email: "ahmad@bandung.id",
      password: "user123",
      role: USER_ROLES.ADMIN_UNIT,
      work_unit_id: 9,
      nip: "199004012020121004",
      phone: "081234567893",
      created_at: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Dewi Lestari",
      email: "dewi@bandung.id",
      password: "user123",
      role: USER_ROLES.USER_UNIT,
      work_unit_id: 9,
      nip: "199005012020121005",
      phone: "081234567894",
      created_at: new Date().toISOString(),
    },
    {
      id: "6",
      name: "Andi Wijaya",
      email: "andi@semarang.id",
      password: "user123",
      role: USER_ROLES.ADMIN_UNIT,
      work_unit_id: 12,
      nip: "199006012020121006",
      phone: "081234567895",
      created_at: new Date().toISOString(),
    },
    {
      id: "7",
      name: "Rina Kusuma",
      email: "rina@semarang.id",
      password: "user123",
      role: USER_ROLES.USER_UNIT,
      work_unit_id: 12,
      nip: "199007012020121007",
      phone: "081234567896",
      created_at: new Date().toISOString(),
    },
  ];

  storage.setUsers(users);

  // Create services
  const services = [
    {
      id: "s1",
      user_id: "3",
      work_unit_id: 8,
      service_type: "kenaikan_pangkat",
      status: SERVICE_STATUS.SUBMITTED,
      title: "Usulan Kenaikan Pangkat Periode April 2025",
      description: "Pengajuan kenaikan pangkat reguler sesuai masa kerja",
      documents: [
        { name: "SK_Terakhir.pdf", size: 245600, url: "#" },
        { name: "DP3.pdf", size: 189400, url: "#" },
      ],
      current_reviewer_id: "2",
      notes: [],
      created_at: "2025-01-15T10:30:00Z",
      updated_at: "2025-01-15T10:30:00Z",
    },
    {
      id: "s2",
      user_id: "5",
      work_unit_id: 9,
      service_type: "cuti",
      status: SERVICE_STATUS.APPROVED_BY_UNIT,
      title: "Permohonan Cuti Tahunan",
      description: "Cuti tahunan untuk keperluan keluarga",
      documents: [],
      current_reviewer_id: "1",
      notes: [{ actor: "Ahmad Yani", role: "admin_unit", note: "Disetujui", timestamp: "2025-01-16T14:20:00Z" }],
      leave_details: {
        leave_type: LEAVE_TYPES.TAHUNAN,
        start_date: "2025-02-01",
        end_date: "2025-02-07",
        total_days: 7,
        substitute_employee: "Andi Wijaya",
        reason: "Keperluan keluarga",
        emergency_contact: "081234567899",
      },
      created_at: "2025-01-14T09:15:00Z",
      updated_at: "2025-01-16T14:20:00Z",
    },
    {
      id: "s3",
      user_id: "7",
      work_unit_id: 12,
      service_type: "kenaikan_pangkat",
      status: SERVICE_STATUS.UNDER_REVIEW_CENTRAL,
      title: "Kenaikan Pangkat Pilihan",
      description: "Usulan kenaikan pangkat pilihan atas prestasi kerja",
      documents: [
        { name: "Sertifikat_Pelatihan.pdf", size: 312000, url: "#" },
        { name: "Piagam_Penghargaan.pdf", size: 278900, url: "#" },
      ],
      current_reviewer_id: "1",
      notes: [
        { actor: "Andi Wijaya", role: "admin_unit", note: "Berkas lengkap, diajukan", timestamp: "2025-01-10T11:00:00Z" },
      ],
      created_at: "2025-01-08T08:00:00Z",
      updated_at: "2025-01-10T11:00:00Z",
    },
  ];

  storage.setServices(services);

  // Create consultations
  const consultations = [
    {
      id: "c1",
      user_id: "3",
      work_unit_id: 8,
      status: CONSULTATION_STATUS.RESPONDED,
      subject: "Pertanyaan tentang Persyaratan Mutasi",
      description: "Saya ingin mengetahui persyaratan lengkap untuk mengajukan mutasi ke unit lain",
      category: "kepegawaian",
      priority: "medium",
      is_escalated: false,
      current_handler_id: "2",
      created_at: "2025-01-14T13:00:00Z",
      updated_at: "2025-01-15T09:30:00Z",
    },
    {
      id: "c2",
      user_id: "5",
      work_unit_id: 9,
      status: CONSULTATION_STATUS.ESCALATED,
      subject: "Masalah Teknis Sistem Kepegawaian",
      description: "Sistem kepegawaian tidak bisa diakses untuk update data",
      category: "teknis",
      priority: "high",
      is_escalated: true,
      current_handler_id: "1",
      created_at: "2025-01-16T10:00:00Z",
      updated_at: "2025-01-16T15:00:00Z",
    },
  ];

  storage.setConsultations(consultations);

  // Create consultation messages
  const messages = [
    {
      id: "m1",
      consultation_id: "c1",
      sender_id: "3",
      sender_role: "user_unit",
      message_type: "question",
      content: "Saya ingin mengetahui persyaratan lengkap untuk mengajukan mutasi ke unit lain. Apakah ada persyaratan khusus?",
      attachments: [],
      is_from_admin_pusat: false,
      created_at: "2025-01-14T13:00:00Z",
    },
    {
      id: "m2",
      consultation_id: "c1",
      sender_id: "2",
      sender_role: "admin_unit",
      message_type: "answer",
      content: "Untuk mutasi antar unit, persyaratannya adalah: 1) Surat permohonan mutasi, 2) Persetujuan atasan langsung, 3) SK Terakhir, 4) DP3 2 tahun terakhir, 5) Surat rekomendasi dari unit tujuan.",
      attachments: [],
      is_from_admin_pusat: false,
      created_at: "2025-01-15T09:30:00Z",
    },
    {
      id: "m3",
      consultation_id: "c2",
      sender_id: "5",
      sender_role: "user_unit",
      message_type: "question",
      content: "Sistem kepegawaian tidak bisa diakses sejak kemarin. Saya perlu update data keluarga tetapi selalu error.",
      attachments: [],
      is_from_admin_pusat: false,
      created_at: "2025-01-16T10:00:00Z",
    },
    {
      id: "m4",
      consultation_id: "c2",
      sender_id: "4",
      sender_role: "admin_unit",
      message_type: "answer",
      content: "Masalah ini sepertinya terkait dengan server pusat. Saya akan eskalasi ke tim teknis pusat.",
      attachments: [],
      is_from_admin_pusat: false,
      created_at: "2025-01-16T11:00:00Z",
    },
  ];

  storage.setConsultationMessages(messages);

  console.log("Seed data initialized successfully");
};

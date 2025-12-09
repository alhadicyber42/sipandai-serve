import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, MessageCircle, Copy, ExternalLink, Search, Calendar, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    formatDateIndonesian,
    getMonthsUntilRetirement,
    getDaysUntilRetirement,
    formatRetirementWhatsAppMessage,
    getRetirementStatusColor,
    getRetirementStatusText
} from "@/utils/retirementUtils";

type Profile = Tables<"profiles">;
type WorkUnit = Tables<"work_units">;
type RetirementReminder = Tables<"retirement_reminders">;

interface EmployeeWithUnit extends Profile {
    work_units?: WorkUnit;
}

interface ReminderWithDetails extends RetirementReminder {
    profiles?: Profile;
    sender?: Profile;
}

const RetirementReminders = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<EmployeeWithUnit[]>([]);
    const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
    const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUnit, setSelectedUnit] = useState<string>("all");
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithUnit | null>(null);
    const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            await Promise.all([
                loadEmployees(),
                loadReminders(),
                loadWorkUnits()
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    const loadEmployees = async () => {
        if (!user) return;

        let query = supabase
            .from("profiles")
            .select(`
        *,
        work_units (*)
      `)
            .not("tmt_pensiun", "is", null)
            .order("tmt_pensiun", { ascending: true });

        // Filter by work unit for admin_unit
        if (user.role === "admin_unit") {
            query = query.eq("work_unit_id", user.work_unit_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error loading employees:", error);
            return;
        }

        // Show all employees with tmt_pensiun for now (can add filter later)
        // Sort by retirement date
        const sortedEmployees = (data || []).sort((a, b) => {
            const dateA = a.tmt_pensiun ? new Date(a.tmt_pensiun).getTime() : Infinity;
            const dateB = b.tmt_pensiun ? new Date(b.tmt_pensiun).getTime() : Infinity;
            return dateA - dateB;
        });

        setEmployees(sortedEmployees);
    };

    const loadReminders = async () => {
        const { data, error } = await supabase
            .from("retirement_reminders")
            .select(`*`)
            .order("sent_at", { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error loading reminders:", error);
            return;
        }

        setReminders((data || []) as any);
    };

    const loadWorkUnits = async () => {
        const { data, error } = await supabase
            .from("work_units")
            .select("*")
            .order("name");

        if (error) {
            console.error("Error loading work units:", error);
            return;
        }

        setWorkUnits(data || []);
    };

    const handleSendEmail = async (employee: EmployeeWithUnit) => {
        if (!employee.email) {
            toast.error("Email pegawai tidak tersedia");
            return;
        }

        if (!employee.tmt_pensiun) {
            toast.error("Tanggal pensiun pegawai tidak tersedia");
            return;
        }

        setSendingEmail(true);
        try {
            const { data, error } = await supabase.functions.invoke("send-retirement-reminder", {
                body: {
                    employeeId: employee.id,
                    employeeName: employee.name,
                    employeeEmail: employee.email,
                    retirementDate: employee.tmt_pensiun,
                    workUnitName: employee.work_units?.name || "Unit Kerja",
                    senderId: user!.id
                }
            });

            if (error) throw error;

            if (data?.success) {
                toast.success(`Email berhasil dikirim ke ${employee.name}`);
                loadData();
            } else {
                throw new Error(data?.error || "Gagal mengirim email");
            }
        } catch (error: any) {
            console.error("Error sending email:", error);
            toast.error(error.message || "Gagal mengirim email");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleOpenWhatsAppDialog = (employee: EmployeeWithUnit) => {
        setSelectedEmployee(employee);
        setWhatsappDialogOpen(true);
    };

    const handleCopyWhatsAppMessage = () => {
        if (!selectedEmployee) return;

        const message = formatRetirementWhatsAppMessage(
            selectedEmployee,
            selectedEmployee.work_units?.name || "Unit Kerja"
        );

        navigator.clipboard.writeText(message);
        toast.success("Pesan berhasil disalin ke clipboard");
    };

    const handleOpenWhatsApp = () => {
        if (!selectedEmployee || !selectedEmployee.phone) {
            toast.error("Nomor telepon pegawai tidak tersedia");
            return;
        }

        const message = formatRetirementWhatsAppMessage(
            selectedEmployee,
            selectedEmployee.work_units?.name || "Unit Kerja"
        );

        // Clean phone number (remove non-digits)
        const cleanPhone = selectedEmployee.phone.replace(/\D/g, "");
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");

        // Log reminder
        supabase
            .from("retirement_reminders")
            .insert({
                user_id: selectedEmployee.id,
                reminder_type: "whatsapp",
                sender_id: user!.id,
                status: "sent",
                message: message
            } as any)
            .then(() => {
                // Update last reminder sent timestamp
                supabase
                    .from("profiles")
                    .update({ retirement_reminder_sent_at: new Date().toISOString() })
                    .eq("id", selectedEmployee.id);

                loadData();
            });
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.nip.includes(searchTerm);
        const matchesUnit = selectedUnit === "all" || emp.work_unit_id?.toString() === selectedUnit;
        return matchesSearch && matchesUnit;
    });

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Memuat data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reminder Pensiun</h1>
                    <p className="text-muted-foreground">
                        Kelola pengingat pensiun untuk pegawai yang akan memasuki masa pensiun
                    </p>
                </div>

                <Tabs defaultValue="employees" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="employees" className="gap-2">
                            <Users className="h-4 w-4" />
                            Daftar Pegawai ({filteredEmployees.length})
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <Bell className="h-4 w-4" />
                            Riwayat Reminder ({reminders.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pegawai Mendekati Masa Pensiun</CardTitle>
                                <CardDescription>
                                    Pegawai yang akan pensiun dalam 6-12 bulan ke depan
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Cari nama atau NIP..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                    {user?.role === "admin_pusat" && (
                                        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Semua Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Unit</SelectItem>
                                                {workUnits.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[150px] pl-4">Nama</TableHead>
                                                <TableHead className="hidden md:table-cell">NIP</TableHead>
                                                <TableHead className="hidden lg:table-cell">Unit Kerja</TableHead>
                                                <TableHead className="min-w-[120px]">Tanggal Pensiun</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="hidden xl:table-cell">Reminder Terakhir</TableHead>
                                                <TableHead className="text-right pr-4">Aksi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredEmployees.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        Tidak ada pegawai yang mendekati masa pensiun
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredEmployees.map((employee) => {
                                                    const retirementDate = employee.tmt_pensiun ? new Date(employee.tmt_pensiun) : null;
                                                    const monthsUntil = retirementDate ? getMonthsUntilRetirement(retirementDate) : 0;
                                                    const daysUntil = retirementDate ? getDaysUntilRetirement(retirementDate) : 0;

                                                    return (
                                                        <TableRow key={employee.id}>
                                                            <TableCell className="pl-4">
                                                                <div className="font-medium text-sm sm:text-base">{employee.name}</div>
                                                                <div className="md:hidden text-xs text-muted-foreground">{employee.nip}</div>
                                                                <div className="lg:hidden text-xs text-muted-foreground line-clamp-1">{employee.work_units?.name}</div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">{employee.nip}</TableCell>
                                                            <TableCell className="hidden lg:table-cell">{employee.work_units?.name || "-"}</TableCell>
                                                            <TableCell>
                                                                {retirementDate ? (
                                                                    <div>
                                                                        <div className="whitespace-nowrap text-sm sm:text-base">{formatDateIndonesian(retirementDate)}</div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {daysUntil} hari lagi
                                                                        </div>
                                                                    </div>
                                                                ) : "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant={getRetirementStatusColor(monthsUntil) as any} className="whitespace-nowrap text-[10px] sm:text-xs">
                                                                    {getRetirementStatusText(monthsUntil)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="hidden xl:table-cell">
                                                                {employee.retirement_reminder_sent_at ? (
                                                                    <div className="text-sm">
                                                                        {formatDateIndonesian(new Date(employee.retirement_reminder_sent_at))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">Belum pernah</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right pr-4">
                                                                <div className="flex justify-end gap-1 sm:gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleSendEmail(employee)}
                                                                        disabled={sendingEmail || !employee.email}
                                                                        className="h-8 w-8 p-0 sm:w-auto sm:h-9 sm:px-3 sm:py-2"
                                                                        title="Kirim Email"
                                                                    >
                                                                        <Mail className="h-4 w-4 sm:mr-1" />
                                                                        <span className="hidden sm:inline">Email</span>
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleOpenWhatsAppDialog(employee)}
                                                                        className="h-8 w-8 p-0 sm:w-auto sm:h-9 sm:px-3 sm:py-2"
                                                                        title="Kirim WhatsApp"
                                                                    >
                                                                        <MessageCircle className="h-4 w-4 sm:mr-1" />
                                                                        <span className="hidden sm:inline">WhatsApp</span>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Reminder</CardTitle>
                                <CardDescription>
                                    Daftar reminder yang telah dikirim
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tanggal</TableHead>
                                                <TableHead>Pegawai</TableHead>
                                                <TableHead>Tipe</TableHead>
                                                <TableHead>Dikirim Oleh</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {reminders.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        Belum ada riwayat reminder
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                reminders.map((reminder) => (
                                                    <TableRow key={reminder.id}>
                                                        <TableCell>
                                                            {formatDateIndonesian(new Date(reminder.sent_at))}
                                                        </TableCell>
                                                        <TableCell>{reminder.profiles?.name || "-"}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {reminder.reminder_type === "email" ? (
                                                                    <><Mail className="h-3 w-3 mr-1" /> Email</>
                                                                ) : (
                                                                    <><MessageCircle className="h-3 w-3 mr-1" /> WhatsApp</>
                                                                )}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{reminder.sender?.name || "-"}</TableCell>
                                                        <TableCell>
                                                            {reminder.status === "sent" ? (
                                                                <Badge variant="default" className="bg-green-500">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                    Terkirim
                                                                </Badge>
                                                            ) : reminder.status === "failed" ? (
                                                                <Badge variant="destructive">
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Gagal
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Pending</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* WhatsApp Template Dialog */}
            <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Template Pesan WhatsApp</DialogTitle>
                        <DialogDescription>
                            Salin template pesan di bawah ini dan kirim melalui WhatsApp
                        </DialogDescription>
                    </DialogHeader>

                    {selectedEmployee && (
                        <div className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="text-sm font-medium mb-2">Kepada: {selectedEmployee.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    Nomor: {selectedEmployee.phone || "Tidak tersedia"}
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-4">
                                <pre className="whitespace-pre-wrap text-sm font-mono">
                                    {formatRetirementWhatsAppMessage(
                                        selectedEmployee,
                                        selectedEmployee.work_units?.name || "Unit Kerja"
                                    )}
                                </pre>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleCopyWhatsAppMessage}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Salin Pesan
                                </Button>
                                <Button
                                    onClick={handleOpenWhatsApp}
                                    disabled={!selectedEmployee.phone}
                                    className="flex-1"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Buka WhatsApp
                                </Button>
                            </div>

                            {!selectedEmployee.phone && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ Nomor telepon pegawai tidak tersedia. Anda hanya dapat menyalin pesan.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default RetirementReminders;

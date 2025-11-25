import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertCircle, Info, Upload, Download, Trash2, Save, Send } from "lucide-react";

/**
 * Enhanced toast helper with better feedback and icons
 */

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export const showToast = {
  // Success toasts with specific contexts
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      icon: <CheckCircle2 className="h-5 w-5" />,
    });
  },

  saved: (itemName: string = "Data") => {
    toast.success(`${itemName} berhasil disimpan`, {
      description: "Perubahan telah tersimpan dengan aman",
      duration: 3000,
      icon: <Save className="h-5 w-5" />,
    });
  },

  submitted: (itemName: string = "Usulan") => {
    toast.success(`${itemName} berhasil diajukan`, {
      description: "Usulan Anda sedang diproses",
      duration: 4000,
      icon: <Send className="h-5 w-5" />,
    });
  },

  approved: (itemName: string = "Usulan") => {
    toast.success(`${itemName} telah disetujui`, {
      description: "Selamat! Usulan Anda telah disetujui",
      duration: 4000,
      icon: <CheckCircle2 className="h-5 w-5" />,
    });
  },

  uploaded: (fileName: string) => {
    toast.success("Upload berhasil", {
      description: `File "${fileName}" telah diupload`,
      duration: 3000,
      icon: <Upload className="h-5 w-5" />,
    });
  },

  downloaded: (fileName: string) => {
    toast.success("Download berhasil", {
      description: `File "${fileName}" telah didownload`,
      duration: 3000,
      icon: <Download className="h-5 w-5" />,
    });
  },

  deleted: (itemName: string = "Data") => {
    toast.success(`${itemName} berhasil dihapus`, {
      description: "Data telah dihapus dari sistem",
      duration: 3000,
      icon: <Trash2 className="h-5 w-5" />,
    });
  },

  // Error toasts with specific contexts
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      icon: <XCircle className="h-5 w-5" />,
    });
  },

  uploadError: (reason?: string) => {
    toast.error("Upload gagal", {
      description: reason || "Terjadi kesalahan saat mengupload file. Silakan coba lagi.",
      duration: 5000,
      icon: <XCircle className="h-5 w-5" />,
    });
  },

  validationError: (fields?: string[]) => {
    toast.error("Validasi gagal", {
      description: fields?.length 
        ? `Periksa kembali: ${fields.join(", ")}`
        : "Mohon lengkapi semua field yang diperlukan",
      duration: 5000,
      icon: <AlertCircle className="h-5 w-5" />,
    });
  },

  permissionError: () => {
    toast.error("Akses ditolak", {
      description: "Anda tidak memiliki izin untuk melakukan tindakan ini",
      duration: 5000,
      icon: <XCircle className="h-5 w-5" />,
    });
  },

  networkError: () => {
    toast.error("Koneksi bermasalah", {
      description: "Periksa koneksi internet Anda dan coba lagi",
      duration: 5000,
      icon: <XCircle className="h-5 w-5" />,
    });
  },

  // Warning toasts
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      icon: <AlertCircle className="h-5 w-5" />,
    });
  },

  // Info toasts
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      icon: <Info className="h-5 w-5" />,
    });
  },

  // Loading toast
  loading: (message: string = "Memproses...") => {
    return toast.loading(message, {
      duration: Infinity,
    });
  },

  // Promise toast for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  // Auto-save notification (subtle)
  autoSaved: () => {
    toast.success("Tersimpan otomatis", {
      duration: 2000,
      icon: <Save className="h-4 w-4" />,
    });
  },
};

// Helper untuk form submission
export const handleFormSubmit = async <T,>(
  submitFn: () => Promise<{ success: boolean; error?: string; data?: T }>,
  successMessage: string = "Berhasil",
  errorMessage: string = "Gagal"
) => {
  const loadingToast = showToast.loading("Memproses...");

  try {
    const result = await submitFn();
    toast.dismiss(loadingToast);

    if (result.success) {
      showToast.success(successMessage);
      return { success: true, data: result.data };
    } else {
      showToast.error(errorMessage, {
        description: result.error || "Terjadi kesalahan yang tidak terduga",
      });
      return { success: false, error: result.error };
    }
  } catch (error: any) {
    toast.dismiss(loadingToast);
    showToast.error(errorMessage, {
      description: error.message || "Terjadi kesalahan yang tidak terduga",
    });
    return { success: false, error: error.message };
  }
};

// Helper untuk file upload dengan progress
export const handleFileUpload = async (
  file: File,
  uploadFn: (file: File) => Promise<string>
): Promise<{ success: boolean; url?: string; error?: string }> => {
  const loadingToast = showToast.loading(`Mengupload ${file.name}...`);

  try {
    const url = await uploadFn(file);
    toast.dismiss(loadingToast);
    showToast.uploaded(file.name);
    return { success: true, url };
  } catch (error: any) {
    toast.dismiss(loadingToast);
    showToast.uploadError(error.message);
    return { success: false, error: error.message };
  }
};

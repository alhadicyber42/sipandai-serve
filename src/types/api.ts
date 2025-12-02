/**
 * Centralized API Response Types
 * Type definitions untuk semua API responses
 */

import { Database } from '@/integrations/supabase/types';

// Base response type untuk Supabase queries
export type SupabaseResponse<T> = {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
};

// Generic API response wrapper
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Paginated response
export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Database table types (re-exported for convenience)
export type Service = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

export type Consultation = Database['public']['Tables']['consultations']['Row'];
export type ConsultationInsert = Database['public']['Tables']['consultations']['Insert'];
export type ConsultationUpdate = Database['public']['Tables']['consultations']['Update'];

export type ConsultationMessage = Database['public']['Tables']['consultation_messages']['Row'];
export type ConsultationMessageInsert = Database['public']['Tables']['consultation_messages']['Insert'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type WorkUnit = Database['public']['Tables']['work_units']['Row'];
export type WorkUnitInsert = Database['public']['Tables']['work_units']['Insert'];

export type LeaveDetail = Database['public']['Tables']['leave_details']['Row'];
export type LeaveDetailInsert = Database['public']['Tables']['leave_details']['Insert'];

// Enums
export type UserRole = Database['public']['Enums']['user_role'];
export type ServiceType = Database['public']['Enums']['service_type'];
export type ServiceStatus = Database['public']['Enums']['service_status'];
export type ConsultationStatus = Database['public']['Enums']['consultation_status'];
export type ConsultationCategory = Database['public']['Enums']['consultation_category'];
export type ConsultationPriority = Database['public']['Enums']['consultation_priority'];
export type LeaveType = Database['public']['Enums']['leave_type'];
export type MessageType = Database['public']['Enums']['message_type'];

// Extended types dengan relations
export interface ServiceWithRelations extends Service {
  profiles?: Profile | null;
  work_units?: WorkUnit | null;
  leave_details?: LeaveDetail[];
}

export interface ConsultationWithRelations extends Consultation {
  profiles?: Profile | null;
  work_units?: WorkUnit | null;
  consultation_messages?: ConsultationMessage[];
}

// Search result types
export interface EmployeeSearchResult {
  id: string;
  name: string;
  nip: string;
  work_unit_id: number;
  work_unit_name?: string;
  email?: string;
}

// Export result types
export interface ExportService {
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


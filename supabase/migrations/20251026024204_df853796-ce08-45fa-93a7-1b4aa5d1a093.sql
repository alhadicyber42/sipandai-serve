-- Create custom types
CREATE TYPE user_role AS ENUM ('user_unit', 'admin_unit', 'admin_pusat');
CREATE TYPE service_type AS ENUM ('kenaikan_pangkat', 'mutasi', 'pensiun', 'cuti');
CREATE TYPE service_status AS ENUM (
  'draft',
  'submitted',
  'under_review_unit',
  'returned_to_user',
  'approved_by_unit',
  'under_review_central',
  'returned_to_unit',
  'approved_final',
  'rejected'
);
CREATE TYPE consultation_status AS ENUM (
  'submitted',
  'under_review',
  'responded',
  'escalated',
  'escalated_responded',
  'follow_up_requested',
  'resolved',
  'closed'
);
CREATE TYPE leave_type AS ENUM (
  'tahunan',
  'sakit',
  'melahirkan',
  'alasan_penting',
  'besar',
  'bersama',
  'di_luar_tanggungan_negara'
);
CREATE TYPE message_type AS ENUM ('question', 'answer', 'follow_up');
CREATE TYPE consultation_category AS ENUM ('kepegawaian', 'administrasi', 'teknis', 'lainnya');
CREATE TYPE consultation_priority AS ENUM ('low', 'medium', 'high');

-- Work Units table
CREATE TABLE work_units (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  admin_unit_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user_unit',
  work_unit_id BIGINT REFERENCES work_units(id),
  nip TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_unit_id BIGINT NOT NULL REFERENCES work_units(id),
  service_type service_type NOT NULL,
  status service_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  description TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  current_reviewer_id UUID REFERENCES auth.users(id),
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Leave details table (for cuti services)
CREATE TABLE leave_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  substitute_employee TEXT,
  reason TEXT NOT NULL,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consultations table
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_unit_id BIGINT NOT NULL REFERENCES work_units(id),
  status consultation_status NOT NULL DEFAULT 'submitted',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category consultation_category,
  priority consultation_priority NOT NULL DEFAULT 'medium',
  is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
  current_handler_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- Consultation messages table
CREATE TABLE consultation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role user_role NOT NULL,
  message_type message_type NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_from_admin_pusat BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service history table
CREATE TABLE service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  actor_role user_role NOT NULL,
  notes TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert work units
INSERT INTO work_units (id, name, code) VALUES
  (1, 'Setditjen Binalavotas', 'SETDITJEN'),
  (2, 'Direktorat Bina Stankomproglat', 'STANKOM'),
  (3, 'Direktorat Bina Lemlatvok', 'LEMLATVOK'),
  (4, 'Direktorat Bina Lavogan', 'LAVOGAN'),
  (5, 'Direktorat Bina Intala', 'INTALA'),
  (6, 'Direktorat Bina Peningkatan Produktivitas', 'PRODUKTIVITAS'),
  (7, 'Set. BNSP', 'BNSP'),
  (8, 'BBPVP Bekasi', 'BBPVP-BEKASI'),
  (9, 'BBPVP Bandung', 'BBPVP-BANDUNG'),
  (10, 'BBPVP Serang', 'BBPVP-SERANG'),
  (11, 'BBPVP Medan', 'BBPVP-MEDAN'),
  (12, 'BBPVP Semarang', 'BBPVP-SEMARANG'),
  (13, 'BBPVP Makassar', 'BBPVP-MAKASSAR'),
  (14, 'BPVP Surakarta', 'BPVP-SURAKARTA'),
  (15, 'BPVP Ambon', 'BPVP-AMBON'),
  (16, 'BPVP Ternate', 'BPVP-TERNATE'),
  (17, 'BPVP Banda Aceh', 'BPVP-ACEH'),
  (18, 'BPVP Sorong', 'BPVP-SORONG'),
  (19, 'BPVP Kendari', 'BPVP-KENDARI'),
  (20, 'BPVP Samarinda', 'BPVP-SAMARINDA'),
  (21, 'BPVP Padang', 'BPVP-PADANG'),
  (22, 'BPVP Bandung Barat', 'BPVP-BANDUNG-BARAT'),
  (23, 'BPVP Lotim', 'BPVP-LOTIM'),
  (24, 'BPVP Bantaeng', 'BPVP-BANTAENG'),
  (25, 'BPVP Banyuwangi', 'BPVP-BANYUWANGI'),
  (26, 'BPVP Sidoarjo', 'BPVP-SIDOARJO'),
  (27, 'BPVP Pangkep', 'BPVP-PANGKEP'),
  (28, 'BPVP Belitung', 'BPVP-BELITUNG');

-- Enable Row Level Security
ALTER TABLE work_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_units
CREATE POLICY "Work units are viewable by everyone" ON work_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admin_pusat can insert work units" ON work_units FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);
CREATE POLICY "Only admin_pusat can update work units" ON work_units FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin unit can view profiles in their unit" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin_unit' 
    AND p.work_unit_id = profiles.work_unit_id
  )
);
CREATE POLICY "Admin pusat can view all profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin pusat can update any profile" ON profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- RLS Policies for services
CREATE POLICY "Users can view their own services" ON services FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin unit can view services in their unit" ON services FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND work_unit_id = services.work_unit_id
  )
);
CREATE POLICY "Admin pusat can view all services" ON services FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);
CREATE POLICY "Users can insert their own services" ON services FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own draft services" ON services FOR UPDATE TO authenticated USING (
  user_id = auth.uid() AND status = 'draft'
);
CREATE POLICY "Users can update returned services" ON services FOR UPDATE TO authenticated USING (
  user_id = auth.uid() AND status IN ('returned_to_user', 'returned_to_unit')
);
CREATE POLICY "Admin unit can update services in their unit" ON services FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND work_unit_id = services.work_unit_id
  )
);
CREATE POLICY "Admin pusat can update any service" ON services FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- RLS Policies for leave_details
CREATE POLICY "Users can view leave details for their services" ON leave_details FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE id = leave_details.service_id AND user_id = auth.uid())
);
CREATE POLICY "Admin can view leave details in their unit" ON leave_details FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM services s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = leave_details.service_id 
    AND (p.role = 'admin_pusat' OR (p.role = 'admin_unit' AND p.work_unit_id = s.work_unit_id))
  )
);
CREATE POLICY "Users can insert leave details for their services" ON leave_details FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update leave details for their services" ON leave_details FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE id = service_id AND user_id = auth.uid())
);

-- RLS Policies for consultations
CREATE POLICY "Users can view their own consultations" ON consultations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin unit can view consultations in their unit" ON consultations FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND work_unit_id = consultations.work_unit_id
  )
);
CREATE POLICY "Admin pusat can view all consultations" ON consultations FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);
CREATE POLICY "Users can insert their own consultations" ON consultations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own consultations" ON consultations FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin unit can update consultations in their unit" ON consultations FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin_unit' 
    AND work_unit_id = consultations.work_unit_id
  )
);
CREATE POLICY "Admin pusat can update any consultation" ON consultations FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin_pusat')
);

-- RLS Policies for consultation_messages
CREATE POLICY "Users can view messages for their consultations" ON consultation_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM consultations 
    WHERE id = consultation_messages.consultation_id 
    AND (user_id = auth.uid() OR current_handler_id = auth.uid())
  )
);
CREATE POLICY "Admin can view messages in their unit consultations" ON consultation_messages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = consultation_messages.consultation_id
    AND (p.role = 'admin_pusat' OR (p.role = 'admin_unit' AND p.work_unit_id = c.work_unit_id))
  )
);
CREATE POLICY "Users can insert messages for their consultations" ON consultation_messages FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultations 
    WHERE id = consultation_id 
    AND (user_id = auth.uid() OR current_handler_id = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM consultations c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = consultation_id
    AND (p.role = 'admin_pusat' OR (p.role = 'admin_unit' AND p.work_unit_id = c.work_unit_id))
  )
);

-- RLS Policies for service_history
CREATE POLICY "Users can view history for their services" ON service_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM services WHERE id = service_history.service_id AND user_id = auth.uid())
);
CREATE POLICY "Admin can view history in their unit" ON service_history FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM services s
    JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = service_history.service_id
    AND (p.role = 'admin_pusat' OR (p.role = 'admin_unit' AND p.work_unit_id = s.work_unit_id))
  )
);
CREATE POLICY "Anyone can insert service history" ON service_history FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

-- Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, work_unit_id, nip, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user_unit'),
    COALESCE((NEW.raw_user_meta_data->>'work_unit_id')::bigint, NULL),
    COALESCE(NEW.raw_user_meta_data->>'nip', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
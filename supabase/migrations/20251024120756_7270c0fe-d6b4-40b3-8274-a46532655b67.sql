-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create users table (for admins/staff)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  street TEXT NOT NULL,
  zip TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create case_records table
CREATE TABLE public.case_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  diag_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'recovered', 'death')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vaccinations table
CREATE TABLE public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  vaccine_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create state_stats table
CREATE TABLE public.state_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  confirmed INTEGER NOT NULL DEFAULT 0,
  recovered INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,
  managed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (role = 'admin');

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (role = 'admin');

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (role = 'admin');

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (role = 'admin');

-- RLS Policies for patients table (admins can do everything)
CREATE POLICY "Admins can view all patients"
  ON public.patients FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update patients"
  ON public.patients FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete patients"
  ON public.patients FOR DELETE
  USING (true);

-- RLS Policies for locations table
CREATE POLICY "Everyone can view locations"
  ON public.locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert locations"
  ON public.locations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update locations"
  ON public.locations FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete locations"
  ON public.locations FOR DELETE
  USING (true);

-- RLS Policies for case_records table
CREATE POLICY "Everyone can view case records"
  ON public.case_records FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert case records"
  ON public.case_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update case records"
  ON public.case_records FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete case records"
  ON public.case_records FOR DELETE
  USING (true);

-- RLS Policies for vaccinations table
CREATE POLICY "Everyone can view vaccinations"
  ON public.vaccinations FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert vaccinations"
  ON public.vaccinations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update vaccinations"
  ON public.vaccinations FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete vaccinations"
  ON public.vaccinations FOR DELETE
  USING (true);

-- RLS Policies for state_stats table
CREATE POLICY "Everyone can view state stats"
  ON public.state_stats FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert state stats"
  ON public.state_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update state stats"
  ON public.state_stats FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete state stats"
  ON public.state_stats FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_case_records_patient ON public.case_records(patient_id);
CREATE INDEX idx_case_records_location ON public.case_records(location_id);
CREATE INDEX idx_vaccinations_patient ON public.vaccinations(patient_id);
CREATE INDEX idx_state_stats_state ON public.state_stats(state);
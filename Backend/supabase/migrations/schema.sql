
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DROP TABLE IF EXISTS public.vaccinations CASCADE;
DROP TABLE IF EXISTS public.case_records CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vaccine_type_enum') THEN
    DROP TYPE public.vaccine_type_enum;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- will be recreated below
    DROP TYPE public.user_role;
  END IF;
END $$;
-- Create user roles enum
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- No enum for vaccination; keep only user_role enum

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
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
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
  vaccine_type TEXT NOT NULL CHECK (vaccine_type IN ('covaxin','covishield','sputnik')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

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


-- Create indexes for better performance
CREATE INDEX idx_case_records_patient ON public.case_records(patient_id);
CREATE INDEX idx_case_records_location ON public.case_records(location_id);
CREATE INDEX idx_vaccinations_patient ON public.vaccinations(patient_id);

-- Optional enumeration lookup table for roles (kept in sync with enum)
CREATE TABLE IF NOT EXISTS public.roles (
  role TEXT PRIMARY KEY
);
INSERT INTO public.roles(role) VALUES ('admin') ON CONFLICT DO NOTHING;
INSERT INTO public.roles(role) VALUES ('user') ON CONFLICT DO NOTHING;

-- Seed initial admin user using bcrypt via pgcrypto
INSERT INTO public.users (first_name, last_name, name, email, password, role)
VALUES ('Admin', 'India', 'Admin India', 'admin@covid.in', crypt('Admin@123', gen_salt('bf')), 'admin')
ON CONFLICT (email) DO NOTHING;

-- Seed demo regular users and linked patients
WITH demo_users AS (
  INSERT INTO public.users (id, first_name, last_name, name, email, password, role)
  VALUES
    (gen_random_uuid(),'Aarav','Sharma','Aarav Sharma','aarav.sharma@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Vihaan','Verma','Vihaan Verma','vihaan.verma@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Isha','Iyer','Isha Iyer','isha.iyer@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Ananya','Nair','Ananya Nair','ananya.nair@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Kabir','Singh','Kabir Singh','kabir.singh@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Riya','Gupta','Riya Gupta','riya.gupta@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Advait','Kulkarni','Advait Kulkarni','advait.kulkarni@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Diya','Patel','Diya Patel','diya.patel@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Arjun','Reddy','Arjun Reddy','arjun.reddy@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Meera','Chopra','Meera Chopra','meera.chopra@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Sanjay','Mishra','Sanjay Mishra','sanjay.mishra@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Pooja','Yadav','Pooja Yadav','pooja.yadav@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Neha','Khan','Neha Khan','neha.khan@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Rohan','Das','Rohan Das','rohan.das@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Kriti','Mehta','Kriti Mehta','kriti.mehta@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Harsh','Bansal','Harsh Bansal','harsh.bansal@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Nisha','Saxena','Nisha Saxena','nisha.saxena@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Vikram','Joshi','Vikram Joshi','vikram.joshi@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Priya','Rastogi','Priya Rastogi','priya.rastogi@mail.in', crypt('User@123', gen_salt('bf')),'user'),
    (gen_random_uuid(),'Ankit','Bhardwaj','Ankit Bhardwaj','ankit.bhardwaj@mail.in', crypt('User@123', gen_salt('bf')),'user')
  ON CONFLICT (email) DO NOTHING
  RETURNING id, first_name, last_name, name
)
INSERT INTO public.patients (id, first_name, last_name, name, contact, dob)
SELECT 
  id,
  first_name,
  last_name,
  name,
  '98' || LPAD((ROW_NUMBER() OVER () - 1)::text, 8, '0') AS contact,
  (DATE '1995-01-01' + ((ROW_NUMBER() OVER ()) * INTERVAL '250 days'))::date AS dob
FROM demo_users
ON CONFLICT (id) DO NOTHING;

-- Seed locations across India (id auto)
INSERT INTO public.locations (name, address, street, zip, state)
SELECT * FROM (
  VALUES
    ('AIIMS Delhi','Ansari Nagar, New Delhi','Aurobindo Marg','110029','Delhi'),
    ('Apollo Mumbai','Navi Mumbai','Belapur Road','400614','Maharashtra'),
    ('Fortis Bengaluru','Bengaluru','Bannerghatta Road','560076','Karnataka'),
    ('CMC Vellore','Vellore','IDA Scudder Rd','632004','Tamil Nadu'),
    ('PGIMER Chandigarh','Chandigarh','Sector 12','160012','Chandigarh'),
    ('Apollo Ahmedabad','Ahmedabad','Bhat GIDC','382428','Gujarat'),
    ('KIMS Hyderabad','Hyderabad','Secunderabad','500003','Telangana'),
    ('IMS Bhubaneswar','Bhubaneswar','Dumduma','751019','Odisha'),
    ('NRS Kolkata','Kolkata','AJC Bose Rd','700014','West Bengal'),
    ('SCTIMST Trivandrum','Thiruvananthapuram','Poojappura','695012','Kerala'),
    ('Ruby Hall Pune','Pune','Sassoon Road','411001','Maharashtra'),
    ('Max Saket','New Delhi','Press Enclave Rd','110017','Delhi'),
    ('AMRI Hospital','Kolkata','Salt Lake','700091','West Bengal'),
    ('Sir Ganga Ram','New Delhi','Rajinder Nagar','110060','Delhi'),
    ('AIIMS Bhopal','Bhopal','Saket Nagar','462020','Madhya Pradesh')
) AS v(name,address,street,zip,state)
WHERE NOT EXISTS (
  SELECT 1 FROM public.locations l WHERE l.name = v.name
);

-- One case record per patient, using a random location if not present
INSERT INTO public.case_records (patient_id, location_id, diag_date, status)
SELECT p.id,
       l.id,
       (CURRENT_DATE - INTERVAL '30 days')::date AS diag_date,
       'active' AS status
FROM public.patients p
CROSS JOIN LATERAL (
  SELECT id FROM public.locations ORDER BY random() LIMIT 1
) l
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_records c WHERE c.patient_id = p.id
);

-- Add an additional recovered record 20 days after diag for half the patients that don't have recovered
INSERT INTO public.case_records (patient_id, location_id, diag_date, status)
SELECT p.id,
       l.id,
       (CURRENT_DATE - INTERVAL '10 days')::date AS diag_date,
       'recovered' AS status
FROM public.patients p
CROSS JOIN LATERAL (
  SELECT id FROM public.locations ORDER BY random() LIMIT 1
) l
WHERE (get_byte(digest(p.id::text, 'sha1'), 0) % 2) = 0 -- deterministic half split
  AND NOT EXISTS (
    SELECT 1 FROM public.case_records c WHERE c.patient_id = p.id AND c.status = 'recovered'
  );

-- Add a death record for a small subset (5%) without an existing death
INSERT INTO public.case_records (patient_id, location_id, diag_date, status)
SELECT p.id,
       l.id,
       (CURRENT_DATE - INTERVAL '5 days')::date AS diag_date,
       'death' AS status
FROM public.patients p
CROSS JOIN LATERAL (
  SELECT id FROM public.locations ORDER BY random() LIMIT 1
) l
WHERE get_byte(digest(p.id::text, 'sha1'), 0) % 20 = 0
  AND NOT EXISTS (
    SELECT 1 FROM public.case_records c WHERE c.patient_id = p.id AND c.status = 'death'
  );

-- One vaccination per patient with random vaccine type
INSERT INTO public.vaccinations (patient_id, date, vaccine_type)
SELECT p.id,
       (CURRENT_DATE - INTERVAL '200 days')::date AS date,
       (ARRAY['covaxin','covishield','sputnik']
       )[1 + floor(random()*3)]
FROM public.patients p
WHERE NOT EXISTS (
  SELECT 1 FROM public.vaccinations v WHERE v.patient_id = p.id
);

-- Add a second dose 180 days after first for half of patients
INSERT INTO public.vaccinations (patient_id, date, vaccine_type)
SELECT p.id,
       (CURRENT_DATE - INTERVAL '20 days')::date AS date,
       (ARRAY['covaxin','covishield','sputnik'])[1 + floor(random()*3)]
FROM public.patients p
WHERE (get_byte(digest(p.id::text, 'sha1'), 0) % 2) = 1
  AND (SELECT count(*) FROM public.vaccinations v WHERE v.patient_id = p.id) < 2;

-- Create deterministic 3 patients with one dose due tomorrow (179 days ago)
DELETE FROM public.vaccinations v
USING (
  SELECT id FROM public.patients ORDER BY id ASC LIMIT 3
) d
WHERE v.patient_id = d.id;

INSERT INTO public.vaccinations (patient_id, date, vaccine_type)
SELECT id, (CURRENT_DATE - INTERVAL '179 days')::date, 'covishield'
FROM (
  SELECT id FROM public.patients ORDER BY id ASC LIMIT 3
) d;
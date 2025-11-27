-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'professional', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy for bookings - professionals can see all bookings
CREATE POLICY "Profissionais podem ver todos os agendamentos"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'professional'));

-- Insert professional user role (user must be created first via signup)
-- The user will need to sign up with UserSebraeMassagem@pi.sebrae.com.br first
-- Then you can manually assign the professional role in the database
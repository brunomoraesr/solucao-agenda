-- Criar tabela de agendamentos
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  period TEXT NOT NULL,
  time TEXT NOT NULL,
  session_type TEXT NOT NULL,
  professional TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_booking UNIQUE (day, period, time, professional)
);

-- Habilitar RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Política para permitir que todos vejam os agendamentos (necessário para verificar disponibilidade)
CREATE POLICY "Qualquer pessoa pode ver agendamentos"
ON public.bookings
FOR SELECT
USING (true);

-- Política para permitir que todos criem agendamentos
CREATE POLICY "Qualquer pessoa pode criar agendamentos"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Índice para melhorar performance nas consultas de disponibilidade
CREATE INDEX idx_bookings_availability ON public.bookings(day, period, time, professional);

CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_income numeric NOT NULL,
  monthly_budget numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  category text NOT NULL,
  note text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read settings" ON public.user_settings FOR SELECT USING (true);
CREATE POLICY "public write settings" ON public.user_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "public update settings" ON public.user_settings FOR UPDATE USING (true);

CREATE POLICY "public read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "public write expenses" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "public update expenses" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "public delete expenses" ON public.expenses FOR DELETE USING (true);

CREATE INDEX expenses_date_idx ON public.expenses(date DESC);

-- ============================================================
-- Fix 1: Add missing UPDATE policy for monitoring_events
-- (needed so the screenshot_url column can be patched after upload)
-- ============================================================

CREATE POLICY "monitoring_events: update own"
  ON public.monitoring_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = monitoring_events.session_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = monitoring_events.session_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- Fix 2: Update handle_new_user trigger to include default role
-- (prevents NOT NULL violation on profiles.role for new signups)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    'proctor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY — AEGIS PROCTORING PLATFORM
-- ============================================================

-- ============================================================
-- profiles
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- exam_sessions
-- ============================================================

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_sessions: select own"
  ON public.exam_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "exam_sessions: insert own"
  ON public.exam_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exam_sessions: update own"
  ON public.exam_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exam_sessions: delete own"
  ON public.exam_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- monitoring_events
-- ============================================================

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_events: select own"
  ON public.monitoring_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = monitoring_events.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "monitoring_events: insert own"
  ON public.monitoring_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = monitoring_events.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "monitoring_events: delete own"
  ON public.monitoring_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = monitoring_events.session_id
        AND s.user_id = auth.uid()
    )
  );

-- ============================================================
-- screenshots
-- ============================================================

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenshots: select own"
  ON public.screenshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = screenshots.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "screenshots: insert own"
  ON public.screenshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = screenshots.session_id
        AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "screenshots: delete own"
  ON public.screenshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_sessions s
      WHERE s.id = screenshots.session_id
        AND s.user_id = auth.uid()
    )
  );;

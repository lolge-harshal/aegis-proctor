-- ============================================================
-- REALTIME — enable publications for live monitoring
-- ============================================================

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.exam_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.monitoring_events;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: increment risk score on high-severity events
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_session_risk_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  increment NUMERIC := 0;
BEGIN
  -- Increment based on severity
  IF NEW.severity = 'high' THEN
    increment := 10;
  ELSIF NEW.severity = 'medium' THEN
    increment := 5;
  ELSE
    increment := 1;
  END IF;

  -- Bump counters on the parent session
  UPDATE public.exam_sessions
  SET
    risk_score      = LEAST(risk_score + increment, 100),
    total_warnings  = total_warnings + 1,
    tab_switch_count = CASE WHEN NEW.event_type = 'tab_switch'
                            THEN tab_switch_count + 1
                            ELSE tab_switch_count END,
    fullscreen_violations = CASE WHEN NEW.event_type = 'fullscreen_exit'
                                 THEN fullscreen_violations + 1
                                 ELSE fullscreen_violations END
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_monitoring_event_insert
  AFTER INSERT ON public.monitoring_events
  FOR EACH ROW EXECUTE FUNCTION public.update_session_risk_score();;

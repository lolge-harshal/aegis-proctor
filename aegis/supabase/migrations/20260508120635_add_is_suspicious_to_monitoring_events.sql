-- ============================================================
-- Add is_suspicious column + optimized indexes
-- ============================================================

ALTER TABLE public.monitoring_events
  ADD COLUMN is_suspicious BOOLEAN NOT NULL DEFAULT true;

-- Partial index: only suspicious events (most queried subset)
CREATE INDEX idx_monitoring_events_is_suspicious
  ON public.monitoring_events(session_id, created_at DESC)
  WHERE is_suspicious = true;

-- Composite index for dashboard aggregation by severity
CREATE INDEX idx_monitoring_events_severity_created
  ON public.monitoring_events(severity, created_at DESC);

-- Composite index for suspicious activity timelines
CREATE INDEX idx_monitoring_events_session_suspicious
  ON public.monitoring_events(session_id, is_suspicious, created_at DESC);;

-- ============================================================
-- AEGIS PROCTORING PLATFORM — INITIAL SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE session_status AS ENUM ('active', 'completed', 'terminated');
CREATE TYPE event_type AS ENUM ('no_face', 'multiple_faces', 'looking_away', 'tab_switch', 'fullscreen_exit');
CREATE TYPE event_severity AS ENUM ('low', 'medium', 'high');

-- ============================================================
-- TABLE: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: exam_sessions
-- ============================================================

CREATE TABLE public.exam_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at            TIMESTAMPTZ,
  ended_at              TIMESTAMPTZ,
  status                session_status NOT NULL DEFAULT 'active',
  risk_score            NUMERIC(5,2) NOT NULL DEFAULT 0,
  fullscreen_violations INT NOT NULL DEFAULT 0,
  tab_switch_count      INT NOT NULL DEFAULT 0,
  total_warnings        INT NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_sessions_user_id   ON public.exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_status    ON public.exam_sessions(status);
CREATE INDEX idx_exam_sessions_created_at ON public.exam_sessions(created_at DESC);

-- ============================================================
-- TABLE: monitoring_events
-- ============================================================

CREATE TABLE public.monitoring_events (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id         UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  event_type         event_type NOT NULL,
  severity           event_severity NOT NULL,
  confidence_score   NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  event_snapshot     JSONB,
  screenshot_url     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_events_session_id  ON public.monitoring_events(session_id);
CREATE INDEX idx_monitoring_events_event_type  ON public.monitoring_events(event_type);
CREATE INDEX idx_monitoring_events_created_at  ON public.monitoring_events(created_at DESC);
CREATE INDEX idx_monitoring_events_severity    ON public.monitoring_events(severity);

-- ============================================================
-- TABLE: screenshots
-- ============================================================

CREATE TABLE public.screenshots (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES public.monitoring_events(id) ON DELETE SET NULL,
  image_url     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screenshots_session_id ON public.screenshots(session_id);
CREATE INDEX idx_screenshots_event_id   ON public.screenshots(event_id);
CREATE INDEX idx_screenshots_created_at ON public.screenshots(created_at DESC);;

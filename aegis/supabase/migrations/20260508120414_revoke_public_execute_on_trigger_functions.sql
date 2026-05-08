-- Revoke public/anon/authenticated EXECUTE on internal trigger functions
-- These are only called by triggers, never directly via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_session_risk_score() FROM PUBLIC, anon, authenticated;;

import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/external-client";

/**
 * Returns the current Supabase session.
 * If `redirectIfNone` is true and there's no session, redirects to /login.
 */
export function useSession(redirectIfNone = true) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { location } = useRouterState();

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
      if (redirectIfNone && !s) {
        navigate({ to: "/login", search: { redirect: location.pathname } });
      }
    });
    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (redirectIfNone && !data.session) {
        navigate({ to: "/login", search: { redirect: location.pathname } });
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { session, user: session?.user ?? null, loading };
}

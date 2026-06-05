import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { LogOut, LayoutDashboard, Users2, Rocket, Inbox, UserCog } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setEmail(session.user.email ?? "");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { count } = await supabase
        .from("connection_requests")
        .select("id", { count: "exact", head: true })
        .eq("to_user", u.user.id)
        .eq("status", "pending");
      if (!cancelled) setPending(count ?? 0);
    };
    load();
    const i = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  const navLink = "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium hover:bg-secondary transition";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-display font-bold text-lg hidden sm:block">Mentor4You</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <Link to="/dashboard" className={navLink} activeProps={{ className: navLink + " bg-secondary" }}>
              <LayoutDashboard className="h-4 w-4" /><span className="hidden md:inline">Matches</span>
            </Link>
            <Link to="/partners" className={navLink} activeProps={{ className: navLink + " bg-secondary" }}>
              <Users2 className="h-4 w-4" /><span className="hidden md:inline">Partners</span>
            </Link>
            <Link to="/projects" className={navLink} activeProps={{ className: navLink + " bg-secondary" }}>
              <Rocket className="h-4 w-4" /><span className="hidden md:inline">Projects</span>
            </Link>
            <Link to="/requests" className={navLink + " relative"} activeProps={{ className: navLink + " bg-secondary relative" }}>
              <Inbox className="h-4 w-4" /><span className="hidden md:inline">Inbox</span>
              {pending > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{pending}</span>
              )}
            </Link>
            <Link to="/settings" className={navLink} activeProps={{ className: navLink + " bg-secondary" }}>
              <UserCog className="h-4 w-4" /><span className="hidden md:inline">Profile</span>
            </Link>
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden lg:block text-sm text-muted-foreground truncate max-w-[180px]">{email}</span>
            <button
              onClick={async () => { await supabase.auth.signOut(); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full hover:bg-secondary transition"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

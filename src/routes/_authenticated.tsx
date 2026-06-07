import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { LogOut, LayoutDashboard, Users2, Rocket, Inbox, UserCog, Bell, Home, MessageSquare } from "lucide-react";
import { markRead, type Notification } from "@/lib/notifications";

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
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/login" });
      else setEmail(session.user.email ?? "");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadCounts = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ count }, { data: ns }, { count: un }] = await Promise.all([
      supabase.from("connection_requests").select("id", { count: "exact", head: true }).eq("to_user", u.user.id).eq("status", "pending"),
      supabase.from("notifications").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", u.user.id).eq("read", false),
    ]);
    setPending(count ?? 0);
    setNotifs((ns || []) as Notification[]);
    setUnread(un ?? 0);
  };

  useEffect(() => {
    loadCounts();
    let channel: any;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      channel = supabase.channel("notif-bell")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${u.user.id}` }, () => loadCounts())
        .subscribe();
    })();
    const i = setInterval(loadCounts, 60000);
    return () => { if (channel) supabase.removeChannel(channel); clearInterval(i); };
  }, []);

  const navLink = "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium hover:bg-secondary transition";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
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
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <div className="relative">
              <button onClick={() => setBellOpen((v) => !v)} className="relative p-2 rounded-full hover:bg-secondary transition" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary" />}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-medium text-sm">Notifications</span>
                      <Link to="/notifications" onClick={() => setBellOpen(false)} className="text-xs text-primary font-medium">See all</Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications.</div>
                      ) : notifs.map((n) => (
                        <Link key={n.id} to={n.link || "/dashboard"}
                          onClick={() => { if (!n.read) markRead(n.id); setBellOpen(false); }}
                          className={`block px-4 py-3 border-b border-border last:border-0 hover:bg-secondary transition ${!n.read ? "bg-primary/5" : ""}`}>
                          <div className="text-sm font-medium">{n.title}</div>
                          {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                          <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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

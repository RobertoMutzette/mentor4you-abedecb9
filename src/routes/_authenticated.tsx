import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import {
  LogOut, Users2, Rocket, Inbox, UserCog, Bell, Home, MessageSquare,
  Compass, ChevronDown, Sparkles,
} from "lucide-react";
import { markRead, type Notification } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AuthLayout,
});

type NavItem = { to: string; label: string; Icon: typeof Home };
const PRIMARY: NavItem[] = [
  { to: "/feed", label: "Feed", Icon: Sparkles },
  { to: "/partners", label: "Partners", Icon: Users2 },
  { to: "/mentors", label: "Mentors", Icon: Compass },
];

function AuthLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [pending, setPending] = useState(0);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  // click-outside for avatar menu
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const initials = (email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal top bar: logo + right-side actions */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0 group">
            <img src={logo} alt="" className="h-8 w-8" />
            <span className="font-display font-bold text-lg tracking-tight">
              Mentor<span className="text-primary">4</span>You
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative p-2.5 rounded-full hover:bg-secondary transition"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
                )}
              </button>
              {bellOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Notifications</span>
                      <Link to="/notifications" onClick={() => setBellOpen(false)} className="text-xs text-primary font-medium">See all</Link>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</div>
                      ) : notifs.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || "/dashboard"}
                          onClick={() => { if (!n.read) markRead(n.id); setBellOpen(false); }}
                          className={`block px-4 py-3 border-b border-border last:border-0 hover:bg-secondary transition ${!n.read ? "bg-primary/5" : ""}`}
                        >
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

            {/* Avatar menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-secondary transition"
                aria-label="Account menu"
              >
                <span className="h-8 w-8 rounded-full bg-primary/15 text-primary text-xs font-display font-bold flex items-center justify-center">
                  {initials}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Signed in as</div>
                    <div className="text-sm font-medium truncate">{email}</div>
                  </div>
                  <MenuLink to="/dashboard" onClick={() => setMenuOpen(false)} Icon={Home} label="Workspace" />
                  <MenuLink to="/messages" onClick={() => setMenuOpen(false)} Icon={MessageSquare} label="Messages" />
                  <MenuLink to="/requests" onClick={() => setMenuOpen(false)} Icon={Inbox} label="Requests" badge={pending} />
                  <MenuLink to="/notifications" onClick={() => setMenuOpen(false)} Icon={Bell} label="Notifications" badge={unread} />
                  <MenuLink to="/projects" onClick={() => setMenuOpen(false)} Icon={Rocket} label="Projects" />
                  <MenuLink to="/settings" onClick={() => setMenuOpen(false)} Icon={UserCog} label="Profile & settings" />
                  <div className="border-t border-border">
                    <button
                      onClick={async () => { setMenuOpen(false); await supabase.auth.signOut(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Give the floating nav breathing room */}
      <div className="pb-32">
        <Outlet />
      </div>

      {/* Floating bottom nav — hover to expand labels */}
      <nav
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/85 backdrop-blur-xl rounded-full p-1.5 flex items-center gap-1 border border-border shadow-[0_20px_60px_-20px_oklch(0_0_0/0.25)]"
        aria-label="Primary"
      >
        {PRIMARY.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group/nav inline-flex items-center gap-0 hover:gap-2 data-[status=active]:gap-2 px-4 py-3 rounded-full text-muted-foreground hover:bg-primary hover:text-primary-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground transition-[gap,background-color,color] duration-300 ease-out"
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="font-medium text-sm max-w-0 overflow-hidden whitespace-nowrap transition-[max-width] duration-300 ease-out group-hover/nav:max-w-24 group-data-[status=active]/nav:max-w-24">
              {label}
            </span>
          </Link>
        ))}
      </nav>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-4 w-4" />
            <span className="font-display font-semibold text-foreground">Mentor4You</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-foreground transition">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition">Terms</Link>
            <Link to="/gdpr" className="hover:text-foreground transition">GDPR</Link>
            <Link to="/guidelines" className="hover:text-foreground transition">Guidelines</Link>
          </div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}

function MenuLink({ to, label, Icon, onClick, badge }: { to: string; label: string; Icon: typeof Home; onClick?: () => void; badge?: number }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-secondary transition"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{badge}</span>
      ) : null}
    </Link>
  );
}

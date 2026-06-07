import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listConversations } from "@/lib/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSignedImage } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/messages")({ component: MessagesLayout });

function MessagesLayout() {
  const [convs, setConvs] = useState<any[]>([]);
  const params = useParams({ strict: false }) as { id?: string };

  const load = () => listConversations().then(setConvs);
  useEffect(() => {
    load();
    let ch: any;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      ch = (supabase as any).channel("dm-list")
        .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages" }, () => load())
        .subscribe();
    })();
    return () => { if (ch) supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-4 py-4 sm:py-6">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-7rem)]">
        <aside className={`border border-border rounded-2xl bg-card overflow-hidden ${params.id ? "hidden md:block" : ""}`}>
          <div className="px-4 py-3 border-b border-border font-semibold">Messages</div>
          <div className="overflow-y-auto h-full">
            {convs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No conversations yet. Open someone's profile and send a message.</div>
            ) : convs.map((c) => <ConvRow key={c.id} c={c} active={params.id === c.id} />)}
          </div>
        </aside>
        <main className={`border border-border rounded-2xl bg-card overflow-hidden ${!params.id ? "hidden md:flex md:items-center md:justify-center md:text-muted-foreground" : "flex flex-col"}`}>
          {params.id ? <Outlet /> : <span>Select a conversation</span>}
        </main>
      </div>
    </div>
  );
}

function ConvRow({ c, active }: { c: any; active: boolean }) {
  const avatar = useSignedImage("avatars", c.other?.avatar_url);
  return (
    <Link to="/messages/$id" params={{ id: c.id }}
      className={`flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-secondary transition ${active ? "bg-secondary" : ""}`}>
      <Avatar className="h-10 w-10">
        {avatar && <AvatarImage src={avatar} />}
        <AvatarFallback>{(c.other?.full_name||"?").slice(0,1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{c.other?.full_name || "Unknown"}</div>
        <div className="text-xs text-muted-foreground truncate">{c.last?.body || "Say hi 👋"}</div>
      </div>
    </Link>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, sendMessage, markMessagesRead, type DMMessage } from "@/lib/messaging";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$id")({ component: Conversation });

function Conversation() {
  const { id } = Route.useParams();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<string>("");
  const [other, setOther] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const msgs = await fetchMessages(id);
    setMessages(msgs);
    await markMessagesRead(id);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setMe(data.user.id);
      const { data: conv } = await (supabase as any).from("conversations").select("user_a, user_b").eq("id", id).maybeSingle();
      if (conv) {
        const otherId = conv.user_a === data.user.id ? conv.user_b : conv.user_a;
        const { data: p } = await (supabase as any).from("profiles").select("id, full_name, avatar_url").eq("id", otherId).maybeSingle();
        setOther(p);
      }
    });
    load();
    const ch = (supabase as any).channel(`dm-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dm_messages", filter: `conversation_id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const submit = async () => {
    if (!body.trim()) return;
    const text = body.trim();
    setBody("");
    await sendMessage(id, text);
    load();
  };

  return (
    <>
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <Link to="/messages" className="md:hidden p-1 rounded-full hover:bg-secondary"><ArrowLeft className="h-4 w-4"/></Link>
        {other && (
          <Link to="/u/$id" params={{ id: other.id }} className="flex items-center gap-2 hover:underline">
            <span className="font-semibold text-sm">{other.full_name}</span>
          </Link>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <Textarea value={body} onChange={(e)=>setBody(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();} }}
          placeholder="Type a message…" className="min-h-[40px] max-h-32 text-sm" />
        <Button onClick={submit} disabled={!body.trim()}><Send className="h-4 w-4" /></Button>
      </div>
    </>
  );
}

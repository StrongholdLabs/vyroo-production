import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";

interface SharedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SharedConversationData {
  id: string;
  title: string;
  icon: string;
  messages: SharedMessage[];
}

function useSharedConversation(shareId: string | undefined) {
  return useQuery({
    queryKey: ["shared-conversation", shareId],
    enabled: !!shareId,
    queryFn: async (): Promise<SharedConversationData> => {
      // Fetch the conversation by share_id
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("id, title, icon")
        .eq("share_id", shareId!)
        .eq("is_shared", true)
        .single();

      if (convError) throw new Error("Conversation not found");

      // Fetch messages
      const { data: messages, error: msgsError } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (msgsError) throw msgsError;

      return {
        id: conv.id,
        title: conv.title,
        icon: conv.icon,
        messages: (messages ?? []) as SharedMessage[],
      };
    },
    retry: false,
  });
}

const SharedConversation = () => {
  const { shareId } = useParams();
  const { data: conversation, isLoading, isError } = useSharedConversation(shareId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-semibold text-foreground">Conversation not found</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
          This conversation may have been unshared or doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 md:px-8 h-14">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-lg font-semibold text-foreground">Vyroo</span>
          </Link>
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-md border border-border bg-muted/50">
            Shared conversation
          </span>
        </div>
      </header>

      {/* Conversation title */}
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-8 pb-4">
        <h1 className="text-xl font-semibold text-foreground">
          {conversation.icon} {conversation.title}
        </h1>
      </div>

      {/* Messages */}
      <div className="mx-auto max-w-3xl px-4 md:px-8 pb-8 space-y-6">
        {conversation.messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="chat-bubble-user px-4 py-3 max-w-lg">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-3xl px-4 md:px-8 pb-12">
        <div
          className="rounded-xl border border-border p-6 text-center"
          style={{ backgroundColor: "hsl(var(--surface-elevated))" }}
        >
          <p className="text-sm font-medium text-foreground mb-1">
            Want to have your own AI conversations?
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Sign up for Vyroo and start chatting with the best AI models.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-foreground text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Try Vyroo
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedConversation;

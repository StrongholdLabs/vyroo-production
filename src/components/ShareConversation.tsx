import { useState } from "react";
import { Share2, Link, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShareConversationProps {
  conversationId: string;
  isShared?: boolean;
  shareId?: string | null;
}

function generateShareId(): string {
  // Generate a URL-safe random ID (21 chars, similar to nanoid)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const array = new Uint8Array(21);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export function ShareConversation({
  conversationId,
  isShared: initialIsShared = false,
  shareId: initialShareId = null,
}: ShareConversationProps) {
  const [isShared, setIsShared] = useState(initialIsShared);
  const [shareId, setShareId] = useState<string | null>(initialShareId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareId ? `https://vyroo.ai/share/${shareId}` : "";

  const handleToggleShare = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      if (enabled) {
        // Generate a share_id if we don't have one
        const newShareId = shareId || generateShareId();
        const { error } = await supabase
          .from("conversations")
          .update({ is_shared: true, share_id: newShareId })
          .eq("id", conversationId);

        if (error) throw error;

        setIsShared(true);
        setShareId(newShareId);
        toast.success("Sharing enabled");
      } else {
        const { error } = await supabase
          .from("conversations")
          .update({ is_shared: false })
          .eq("id", conversationId);

        if (error) throw error;

        setIsShared(false);
        toast.success("Sharing disabled");
      }
    } catch (err) {
      toast.error("Failed to update sharing settings");
      console.error("Share toggle error:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
          title="Share conversation"
        >
          <Share2 size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Share conversation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anyone with the link can view
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isUpdating && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
              <Switch
                checked={isShared}
                onCheckedChange={handleToggleShare}
                disabled={isUpdating}
              />
            </div>
          </div>

          {isShared && shareId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-border bg-muted/50 text-xs text-muted-foreground truncate font-mono">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  title="Copy link"
                >
                  {copied ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <Link size={14} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

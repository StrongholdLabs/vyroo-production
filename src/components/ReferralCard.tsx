import { useState } from "react";
import { cn } from "@/lib/utils";
import { useReferralCode, useReferralStats } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import {
  Gift,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Mail,
  Users,
  UserCheck,
  Award,
} from "lucide-react";

const REFERRAL_BASE_URL = "https://vyroo.ai/?ref=";

export default function ReferralCard() {
  const { data: referralCode, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = referralCode
    ? `${REFERRAL_BASE_URL}${referralCode}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareMessage = `Check out Vyroo — an AI assistant that's been super helpful for me. Sign up with my link and we both get a free month of Pro! ${referralLink}`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      "Try Vyroo — AI Assistant (free month for both of us!)"
    );
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const isLoading = codeLoading || statsLoading;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
        "p-6 space-y-5"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Invite friends, get 1 month of Pro free!
          </h3>
          <p className="text-sm text-muted-foreground">
            Share your referral link and earn rewards when friends sign up.
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Your referral link
        </label>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex-1 rounded-lg border border-border/50 bg-muted/50 px-3 py-2",
              "text-sm text-foreground font-mono truncate select-all"
            )}
          >
            {isLoading ? (
              <span className="text-muted-foreground animate-pulse">
                Loading...
              </span>
            ) : (
              referralLink
            )}
          </div>
          <button
            onClick={handleCopy}
            disabled={isLoading || !referralLink}
            className={cn(
              "inline-flex items-center justify-center rounded-lg px-3 py-2",
              "border border-border/50 bg-background",
              "text-sm font-medium text-foreground",
              "hover:bg-muted/50 transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Share via:</span>
        <button
          onClick={handleShareTwitter}
          disabled={isLoading || !referralLink}
          className={cn(
            "inline-flex items-center justify-center rounded-lg p-2",
            "border border-border/50 bg-background",
            "hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Share on Twitter"
        >
          <Twitter className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleShareLinkedIn}
          disabled={isLoading || !referralLink}
          className={cn(
            "inline-flex items-center justify-center rounded-lg p-2",
            "border border-border/50 bg-background",
            "hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={handleShareEmail}
          disabled={isLoading || !referralLink}
          className={cn(
            "inline-flex items-center justify-center rounded-lg p-2",
            "border border-border/50 bg-background",
            "hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Share via Email"
        >
          <Mail className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={cn(
            "rounded-lg border border-border/50 bg-muted/30 p-3",
            "flex flex-col items-center gap-1"
          )}
        >
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xl font-bold text-foreground">
            {isLoading ? "—" : stats?.pending ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">Invited</span>
        </div>
        <div
          className={cn(
            "rounded-lg border border-border/50 bg-muted/30 p-3",
            "flex flex-col items-center gap-1"
          )}
        >
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-xl font-bold text-foreground">
            {isLoading ? "—" : stats?.completed ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">Signed Up</span>
        </div>
        <div
          className={cn(
            "rounded-lg border border-border/50 bg-muted/30 p-3",
            "flex flex-col items-center gap-1"
          )}
        >
          <Award className="h-4 w-4 text-muted-foreground" />
          <span className="text-xl font-bold text-foreground">
            {isLoading ? "—" : stats?.rewarded ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">Rewarded</span>
        </div>
      </div>
    </div>
  );
}

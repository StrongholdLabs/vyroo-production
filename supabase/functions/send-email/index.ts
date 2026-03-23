// Supabase Edge Function: Send Email via Resend
// Sends transactional emails (welcome, usage alerts, subscription changes)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Vyroo <noreply@vyroo.ai>";
const FALLBACK_FROM = "Vyroo <onboarding@resend.dev>";

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Vyroo!",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">Welcome to Vyroo</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;line-height:1.6;">Hi ${name},</p>
      <p style="font-size:16px;color:#374151;line-height:1.6;">Thanks for joining Vyroo! Your AI assistant is ready to help you with research, coding, writing, and much more.</p>
      <p style="font-size:16px;color:#374151;line-height:1.6;">Here are a few things you can do to get started:</p>
      <ul style="font-size:15px;color:#374151;line-height:1.8;">
        <li>Start a conversation with any of our AI models</li>
        <li>Connect your tools (GitHub, Google, Slack, Notion)</li>
        <li>Enable skills to unlock specialized capabilities</li>
      </ul>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://vyroo.ai/dashboard" style="background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Open Vyroo</a>
      </div>
      <p style="font-size:14px;color:#9ca3af;line-height:1.5;">If you have any questions, just reply to this email. We're here to help!</p>
    </div>
  </div>
</body>
</html>`,
  };
}

function usageAlertEmail(
  name: string,
  usage: number,
  limit: number
): { subject: string; html: string } {
  const pct = Math.round((usage / limit) * 100);
  return {
    subject: `Usage Alert: You've used ${pct}% of your plan`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">Usage Alert</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;line-height:1.6;">Hi ${name},</p>
      <p style="font-size:16px;color:#374151;line-height:1.6;">You've used <strong>${usage.toLocaleString()}</strong> of your <strong>${limit.toLocaleString()}</strong> message limit (<strong>${pct}%</strong>).</p>
      <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:24px 0;">
        <div style="background:#e5e7eb;border-radius:999px;height:12px;overflow:hidden;">
          <div style="background:${pct >= 90 ? "#ef4444" : "#f59e0b"};height:100%;width:${Math.min(pct, 100)}%;border-radius:999px;"></div>
        </div>
        <p style="text-align:center;margin:8px 0 0;font-size:14px;color:#6b7280;">${usage.toLocaleString()} / ${limit.toLocaleString()} messages</p>
      </div>
      <p style="font-size:16px;color:#374151;line-height:1.6;">Consider upgrading your plan for higher limits and additional features.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://vyroo.ai/dashboard?tab=billing" style="background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">View Plans</a>
      </div>
    </div>
  </div>
</body>
</html>`,
  };
}

function subscriptionEmail(
  name: string,
  plan: string,
  action: "created" | "updated" | "cancelled"
): { subject: string; html: string } {
  const actionText: Record<string, string> = {
    created: "Your subscription is now active",
    updated: "Your subscription has been updated",
    cancelled: "Your subscription has been cancelled",
  };
  const actionDetail: Record<string, string> = {
    created: `You're now on the <strong>${plan}</strong> plan. Enjoy all the premium features!`,
    updated: `Your plan has been changed to <strong>${plan}</strong>. The changes take effect immediately.`,
    cancelled: `Your <strong>${plan}</strong> plan has been cancelled. You'll retain access until the end of your current billing period.`,
  };
  const badgeColor = action === "cancelled" ? "#ef4444" : "#10b981";

  return {
    subject: `Subscription ${action}: ${plan} plan`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:28px;">Subscription Update</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;line-height:1.6;">Hi ${name},</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="background:${badgeColor};color:#fff;padding:8px 20px;border-radius:999px;font-size:14px;font-weight:600;">${actionText[action]}</span>
      </div>
      <p style="font-size:16px;color:#374151;line-height:1.6;text-align:center;">${actionDetail[action]}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="https://vyroo.ai/dashboard" style="background:#6366f1;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Go to Dashboard</a>
      </div>
      <p style="font-size:14px;color:#9ca3af;line-height:1.5;">If you didn't make this change, please contact us immediately.</p>
    </div>
  </div>
</body>
</html>`,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

type EmailType = "welcome" | "password-reset" | "usage-alert" | "subscription" | "general";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { to, subject, html, type, ...extra } = await req.json() as {
      to?: string;
      subject?: string;
      html?: string;
      type?: EmailType;
      name?: string;
      usage?: number;
      limit?: number;
      plan?: string;
      action?: "created" | "updated" | "cancelled";
    };

    // Resolve email content from template or raw values
    let emailSubject = subject;
    let emailHtml = html;
    const recipientName = extra.name || user.user_metadata?.full_name || user.email!;

    if (type && type !== "general") {
      switch (type) {
        case "welcome": {
          const tpl = welcomeEmail(recipientName);
          emailSubject = tpl.subject;
          emailHtml = tpl.html;
          break;
        }
        case "usage-alert": {
          if (extra.usage == null || extra.limit == null) {
            return new Response(
              JSON.stringify({ error: "usage and limit are required for usage-alert type" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const tpl = usageAlertEmail(recipientName, extra.usage, extra.limit);
          emailSubject = tpl.subject;
          emailHtml = tpl.html;
          break;
        }
        case "subscription": {
          if (!extra.plan || !extra.action) {
            return new Response(
              JSON.stringify({ error: "plan and action are required for subscription type" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const tpl = subscriptionEmail(recipientName, extra.plan, extra.action);
          emailSubject = tpl.subject;
          emailHtml = tpl.html;
          break;
        }
        case "password-reset": {
          // Password reset is handled by Supabase Auth natively;
          // this is a placeholder if custom styling is desired later.
          emailSubject = emailSubject || "Reset your Vyroo password";
          break;
        }
      }
    }

    if (!emailSubject || !emailHtml) {
      return new Response(
        JSON.stringify({ error: "subject and html are required (or provide a valid type)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipient = to || user.email!;

    // Send via Resend API
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try primary from address; fall back if domain not verified yet
    let fromAddress = FROM_ADDRESS;
    let resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipient],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    // If domain not verified, retry with fallback
    if (!resendResponse.ok) {
      const errBody = await resendResponse.json();
      if (
        errBody?.message?.includes("domain") ||
        errBody?.statusCode === 403
      ) {
        console.warn("Primary domain not verified, using fallback from address");
        fromAddress = FALLBACK_FROM;
        resendResponse = await fetch(RESEND_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipient],
            subject: emailSubject,
            html: emailHtml,
          }),
        });
      }
    }

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      return new Response(
        JSON.stringify({ error: resendData?.message || "Failed to send email" }),
        { status: resendResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id, from: fromAddress }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

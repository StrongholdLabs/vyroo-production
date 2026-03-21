// Supabase Edge Function: Create Stripe Checkout Session
// Creates a Stripe checkout session for subscription purchases

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

// Helper to make Stripe API requests using fetch
async function stripeRequest(
  endpoint: string,
  method: string,
  body?: Record<string, string>,
  stripeKey?: string
): Promise<any> {
  const key = stripeKey || Deno.env.get("STRIPE_SECRET_KEY")!;
  const response = await fetch(`${STRIPE_API_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Stripe API error: ${response.status}`);
  }
  return data;
}

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, planName } = await req.json();

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Missing priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already has a Stripe customer ID in their subscription
    let stripeCustomerId: string | null = null;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    } else {
      // Search Stripe for existing customer by email
      const searchResult = await stripeRequest(
        `/customers?email=${encodeURIComponent(user.email!)}`,
        "GET",
        undefined,
        stripeKey
      );

      if (searchResult.data?.length > 0) {
        stripeCustomerId = searchResult.data[0].id;
      } else {
        // Create a new Stripe customer
        const customer = await stripeRequest(
          "/customers",
          "POST",
          {
            email: user.email!,
            name: user.user_metadata?.full_name || user.email!,
            "metadata[user_id]": user.id,
          },
          stripeKey
        );
        stripeCustomerId = customer.id;
      }
    }

    // Determine success and cancel URLs
    const appUrl = Deno.env.get("APP_URL") || "https://vyroo.ai";
    const successUrl = `${appUrl}/dashboard?checkout=success&plan=${planName || "pro"}`;
    const cancelUrl = `${appUrl}/dashboard?checkout=canceled`;

    // Create Stripe checkout session
    const session = await stripeRequest(
      "/checkout/sessions",
      "POST",
      {
        customer: stripeCustomerId!,
        mode: "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        success_url: successUrl,
        cancel_url: cancelUrl,
        "metadata[user_id]": user.id,
        "metadata[plan_name]": planName || "pro",
        "subscription_data[metadata][user_id]": user.id,
        "subscription_data[metadata][plan_name]": planName || "pro",
      },
      stripeKey
    );

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

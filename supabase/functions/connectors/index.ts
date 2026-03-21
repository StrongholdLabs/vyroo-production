// Supabase Edge Function: Connectors Management
// CRUD for user connector integrations

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONNECTOR_REGISTRY } from "../_shared/connectors/registry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

  try {
    if (req.method === "GET") {
      // Fetch user's connected connectors
      const { data: userConnectors } = await supabase
        .from("user_connectors")
        .select("connector_id, status, account_info, config, created_at")
        .eq("user_id", user.id);

      // Merge with registry for full connector info
      const connectorMap = new Map(
        (userConnectors || []).map((uc) => [uc.connector_id, uc])
      );

      const connectors = Object.values(CONNECTOR_REGISTRY).map((def) => {
        const userConn = connectorMap.get(def.id);
        return {
          ...def,
          status: userConn?.status || "disconnected",
          accountInfo: userConn?.account_info || {},
          connectedAt: userConn?.created_at || null,
        };
      });

      return new Response(JSON.stringify({ connectors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const { connector_id, api_key } = await req.json();

      if (!connector_id) {
        return new Response(JSON.stringify({ error: "Missing connector_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const connectorDef = CONNECTOR_REGISTRY[connector_id];
      if (!connectorDef) {
        return new Response(JSON.stringify({ error: "Unknown connector" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (connectorDef.authType === "api_key" && !api_key) {
        return new Response(JSON.stringify({ error: "API key required for this connector" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Upsert the connector
      const { error } = await supabase
        .from("user_connectors")
        .upsert(
          {
            user_id: user.id,
            connector_id,
            status: "connected",
            access_token_encrypted: api_key || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,connector_id" }
        );

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { connector_id } = await req.json();

      if (!connector_id) {
        return new Response(JSON.stringify({ error: "Missing connector_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("user_connectors")
        .delete()
        .eq("user_id", user.id)
        .eq("connector_id", connector_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

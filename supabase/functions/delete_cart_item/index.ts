import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import SupabaseClient from "../_shared/supabaseClient.ts";
import AdminCheck from "../_shared/userAdminCheck.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = SupabaseClient(req);
    // Retrieve calling user's auth and role for checking
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: { ...corsHeaders },
        }
      );
    }

    const body = await req.json();
    if (!body.cart_item_id) {
      return new Response(null, {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the profile data
    const { data, error } = await supabaseClient
      .from("cart_items")
      .delete()
      .eq("id", body.cart_item_id);

    if (error) {
      console.error(error);
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: error.code,
      }
    );
  }
});

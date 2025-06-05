import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import SupabaseClient from "../_shared/supabaseClient.ts";

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

    // 1. Get the cart ID for the user
    const { data: cart, error: cartError } = await supabaseClient
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (cartError || !cart) {
      console.error(cartError);
      throw cartError;
    }

    // 2. Get cart_items by cart_id
    const { data: cartItems, error: itemsError } = await supabaseClient
      .from("cart_items")
      .select("*")
      .eq("cart_id", cart.id);

    if (itemsError) {
      console.error(itemsError);
      throw itemsError;
    }

    return new Response(JSON.stringify(cartItems), {
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

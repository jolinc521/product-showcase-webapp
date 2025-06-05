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

    const body = await req.json();
    const { product_id, quantity } = body;

    if (!product_id || typeof quantity !== "number") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Step 1: Get or create the user's cart
    let { data: cart, error: cartFetchError } = await supabaseClient
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (cartFetchError && cartFetchError.code !== "PGRST116") {
      throw cartFetchError;
    }

    if (!cart) {
      const { data: newCart, error: cartCreateError } = await supabaseClient
        .from("carts")
        .insert([{ user_id: user.id }])
        .select()
        .single();

      if (cartCreateError) throw cartCreateError;
      cart = newCart;
    }

    // Step 2: Upsert cart item
    const { data: cartItem, error: cartItemError } = await supabaseClient
      .from("cart_items")
      .upsert(
        [
          {
            cart_id: cart.id,
            product_id: product_id,
            quantity: quantity,
          },
        ],
        {
          onConflict: "cart_id,product_id",
        }
      )
      .select()
      .single(); // get the resulting item

    if (cartItemError) throw cartItemError;

    return new Response(null, {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
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
        status: 500,
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import SupabaseClient from "../_shared/supabaseClient.ts";

Deno.serve(async (req) => {
  const supabase = SupabaseClient(req);
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

    // Fetch the product data
    const addrData = {
      user_id: user.id,
      street: body.street || "",
      city: body.city || "",
      state: body.state || "",
      postcode: body.postcode || "",
      country: body.country || "",
    };

    // Check if the user already has an address
    const { data: existingAddress, error: existingError } = await supabaseClient
      .from("address")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error(existingError);
      throw existingError;
    }

    // If an address exists, delete it before inserting the new one
    const { data: deleteAddress, error: deleteError } = await supabaseClient
      .from("address")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error(deleteError);
      throw deleteError;
    }

    // Insert the new address
    const { data: insertAddress, error } = await supabaseClient
      .from("address")
      .insert([addrData])
      .select();

    if (error) {
      console.error(error);
      throw error;
    }

    return new Response(null, {
      headers: { "Content-Type": "application/json" },
      status: 201,
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

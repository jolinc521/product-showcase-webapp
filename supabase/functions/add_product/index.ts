import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {corsHeaders} from "../_shared/cors.ts";
import SupabaseClient from "../_shared/supabaseClient.ts";
import AdminCheck from "../_shared/userAdminCheck.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try{
    const supabaseClient = SupabaseClient(req)
    const authorized = await AdminCheck(supabaseClient, req);
    if (!authorized) {
      throw new Response("Not authorized to perform this action", {status: 401});
    }

    // Retrieve calling user's auth and role for checking
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401, headers:{...corsHeaders}
      });
    }

    const body = await req.json();

    // Fetch the product data
    const productData = {
      title: body.title || '',
      description: body.description || '',
      price: body.price || 0,
      image_url: '',
    }

    const { data, error } = await supabaseClient
      .from('products')
      .insert([productData])
      .select()

    if (error) {
      console.error(error)
      throw error
    }

    return new Response(
      null,
      { headers: { "Content-Type": "application/json" }, status: 201 },
    )

  }catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
})

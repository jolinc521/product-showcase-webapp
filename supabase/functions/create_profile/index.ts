import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import {corsHeaders} from "../_shared/cors.ts";
import SupabaseClient from "../_shared/supabaseClient.ts";


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try{
    const supabaseClient = SupabaseClient(req)

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

    // Fetch the profile data
    const profileData = {
      id: user.id,
      email: user.email,
      first_name: body.first_name || '',
      last_name: body.last_name || '',
      phone: body.phone || '',
      role: body.role || 'user',
    }

    const { data, error } = await supabaseClient
      .from('profiles')
      .insert([profileData])
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

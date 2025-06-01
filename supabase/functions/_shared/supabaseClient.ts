import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2";
export default function SupabaseClient (req){
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'), {
        global: {
            headers: {
                Authorization: req.headers.get('Authorization')
            }
        }
    });
    return supabaseClient
}

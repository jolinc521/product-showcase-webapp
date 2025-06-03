import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default function SupabseAdminClient (req){
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
        global: {
            headers: {
                Authorization: req.headers.get('Authorization')
            }
        }
    });
    return supabaseClient
}

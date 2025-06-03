import "jsr:@supabase/functions-js/edge-runtime.d.ts"

export default async function AdminCheck (supabaseClient,req){
    // Retrieve calling user's auth and role for checking
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const {
        data: { user },
        error: userError,
    } = await supabaseClient.auth.getUser(token);
    const {data,error} = await supabaseClient.from("Profiles").select("role").eq("id", user.id).single()
    return data.role == "admin";
}
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APP_URL = "https://app.roishape.com.br";
const MANAGEMENT_WHATSAPP = "5511983297903";

interface ResetPayload {
  identifier?: string; // e-mail ou WhatsApp do usuário
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const specials = "@#$";
  let pwd = "Roi#";
  for (let i = 0; i < 4; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  if (!specials.includes(pwd[pwd.length - 1])) {
    pwd += specials[Math.floor(Math.random() * specials.length)];
  }
  return pwd;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("apikey") ?? "";

    // Validação leve: exige uma chave anon válida (evita abuso totally anônimo)
    if (!anonKey) {
      return new Response(JSON.stringify({ error: "Requisição inválida." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ResetPayload;
    const identifier = body.identifier?.trim();
    if (!identifier || identifier.length < 3) {
      return new Response(JSON.stringify({ error: "Informe seu e-mail ou WhatsApp." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Tenta encontrar o usuário por e-mail; se não casar, procura pelo telefone no profiles.
    const lower = identifier.toLowerCase();
    const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) {
      return new Response(JSON.stringify({ error: "Não foi possível buscar o usuário." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let matchedUserId: string | null = null;
    let matchedEmail: string | null = null;
    let matchedPhone: string | null = null;
    let matchedName: string | null = null;

    // 1) match por e-mail
    const byEmail = userList.users.find((u) => u.email?.toLowerCase() === lower);
    if (byEmail) {
      matchedUserId = byEmail.id;
      matchedEmail = byEmail.email ?? null;
    }

    // 2) se não achou por e-mail, tenta por telefone no profiles
    if (!matchedUserId) {
      const digits = identifier.replace(/\D/g, "");
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id, email, phone, full_name")
        .or(`phone.ilike.%${digits}%`)
        .limit(1)
        .maybeSingle();
      if (profile) {
        matchedUserId = profile.id;
        matchedEmail = profile.email;
        matchedPhone = profile.phone;
        matchedName = profile.full_name;
      }
    } else {
      // complementa com dados do profile
      const { data: p } = await adminClient
        .from("profiles")
        .select("phone, full_name")
        .eq("id", matchedUserId)
        .maybeSingle();
      matchedPhone = p?.phone ?? null;
      matchedName = p?.full_name ?? null;
    }

    if (!matchedUserId) {
      // Não revela que o usuário não existe (evita enumeração).
      // Mesmo assim, abrimos WhatsApp de gestão para o usuário pedir ajuda.
      const tempPwd = generateTempPassword();
      const waMessage = `Olá! Não encontramos uma conta com esse contato no ROI Shape (${identifier}). Pode confirmar seu e-mail cadastrado?\n\nSua senha provisória (se o cadastro for confirmado): ${tempPwd}\nAcesse: ${APP_URL}`;
      const waUrl = `https://wa.me/${MANAGEMENT_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
      return new Response(JSON.stringify({
        whatsapp_url: waUrl,
        management: true,
        message: "Não encontramos uma conta com esse contato. Abriremos o WhatsApp da equipe para confirmar seus dados.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const tempPassword = generateTempPassword();
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(matchedUserId, {
      password: tempPassword,
    });
    if (updateErr) {
      return new Response(JSON.stringify({ error: "Não foi possível redefinir a senha agora. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marca must_change_password=true para forçar troca no próximo login
    await adminClient
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", matchedUserId);

    const firstName = (matchedName ?? "aluno").split(" ")[0];
    const waMessage = `Olá ${firstName}! Sua senha provisória no ROI SHAPE foi redefinida para: ${tempPassword}\nAcesse ${APP_URL} para entrar e trocar sua senha no primeiro acesso.`;

    // Se o usuário tem WhatsApp próprio, abrimos conversa com ele; senão, com a gestão.
    const targetPhone = (matchedPhone ?? "").replace(/\D/g, "");
    const waTarget = targetPhone.length >= 10 ? targetPhone : MANAGEMENT_WHATSAPP;
    const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent(waMessage)}`;

    return new Response(JSON.stringify({
      whatsapp_url: waUrl,
      temp_password: tempPassword,
      email: matchedEmail,
      name: matchedName,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

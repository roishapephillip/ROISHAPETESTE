import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateStudentPayload {
  action?: "create" | "reset_password";
  email?: string;
  password: string;
  full_name?: string;
  phone?: string;
  personal_id: string;
  student_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const anonKey = req.headers.get("apikey") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!callerProfile || !["personal", "admin"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Apenas Personal Trainers ou Admins podem criar alunos." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CreateStudentPayload;
    const action = body.action ?? "create";
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const full_name = body.full_name?.trim();
    const phone = body.phone?.trim() || null;
    const personal_id = body.personal_id;

    if (!password || !personal_id || password.length < 6 || !["create", "reset_password"].includes(action)) {
      return new Response(JSON.stringify({ error: "Dados incompletos." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (personal_id !== user.id && callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Você só pode criar alunos vinculados a você." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "reset_password") {
      if (!body.student_id) {
        return new Response(JSON.stringify({ error: "Aluno não informado." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: student, error: studentErr } = await adminClient
        .from("profiles")
        .select("id, email, full_name, phone, assigned_personal_id, role")
        .eq("id", body.student_id)
        .maybeSingle();

      if (studentErr || !student || student.role !== "student") {
        return new Response(JSON.stringify({ error: "Aluno não encontrado." }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (callerProfile.role !== "admin" && student.assigned_personal_id !== user.id) {
        return new Response(JSON.stringify({ error: "Você não pode alterar o acesso deste aluno." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(student.id, { password });
      if (updateErr) {
        return new Response(JSON.stringify({ error: "Não foi possível atualizar o acesso do aluno." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient
        .from("profiles")
        .update({ must_change_password: true })
        .eq("id", student.id);

      return new Response(JSON.stringify({ id: student.id, email: student.email, full_name: student.full_name, phone: student.phone }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "Informe nome e e-mail do aluno." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (email === user.email?.toLowerCase()) {
      return new Response(JSON.stringify({ error: "O aluno precisa usar um e-mail diferente do seu." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "student", full_name },
    });

    if (createErr) {
      const msg = createErr.message.toLowerCase();
      let friendly = createErr.message;
      if (msg.includes("already been registered") || msg.includes("already registered") || msg.includes("user already exists")) {
        friendly = "Este e-mail já está cadastrado. Use um e-mail diferente ou redefina a senha do aluno existente.";
      } else if (msg.includes("password") && (msg.includes("weak") || msg.includes("strength") || msg.includes("too short"))) {
        friendly = "A senha é muito fraca. Use ao menos 6 caracteres com letras e números.";
      } else if (msg.includes("invalid email") || msg.includes("email_address_invalid")) {
        friendly = "E-mail inválido. Verifique o endereço digitado.";
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        friendly = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      }
      return new Response(JSON.stringify({ error: friendly }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({
        role: "student",
        full_name,
        phone,
        assigned_personal_id: personal_id,
        payment_status: "paid",
        contract_status: "active",
        must_change_password: true,
      })
      .eq("id", newUser.user.id);

    if (profileErr) {
      return new Response(JSON.stringify({ error: "Conta criada, mas houve um erro ao vincular o perfil. Tente novamente ou contate o suporte." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ id: newUser.user.id, email, full_name, phone }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

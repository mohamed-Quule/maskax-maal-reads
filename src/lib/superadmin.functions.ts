import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Idempotent: creates the ONE superadmin account. Refuses if a superadmin
// already exists, so this is safe as a public endpoint for first-run setup.
export const bootstrapSuperadmin = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string; fullName?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: cErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "superadmin");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) {
      throw new Error("A superadmin already exists. This setup is closed.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName ?? "Super Administrator" },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;

    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "superadmin" });
    // remove default 'user' role auto-added by trigger
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "user");

    return { ok: true as const, userId: uid };
  });

// Create a bookshop + its admin account (superadmin only).
export const createBookshopWithAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      name: string;
      slug: string;
      city?: string;
      phone?: string;
      address?: string;
      adminEmail: string;
      adminPassword: string;
      adminFullName: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "superadmin",
    });
    if (!isSuper) throw new Error("Forbidden: superadmin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: data.adminFullName },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;

    // grant admin role
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "admin" });
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "bookshop" });

    const { data: shop, error: sErr } = await supabaseAdmin
      .from("bookshops")
      .insert({
        name: data.name,
        slug: data.slug,
        city: data.city ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        owner_user_id: uid,
      })
      .select()
      .single();
    if (sErr) {
      await supabaseAdmin.auth.admin.deleteUser(uid);
      throw new Error(sErr.message);
    }

    return { ok: true as const, bookshopId: shop.id, adminUserId: uid };
  });

// Platform-wide user counts for superadmin dashboard.
export const getPlatformStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isSuper } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "superadmin",
    });
    if (!isSuper) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: total }, { data: roleRows }, { count: shops }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("user_roles").select("role"),
      supabaseAdmin.from("bookshops").select("*", { count: "exact", head: true }),
    ]);
    const byRole: Record<string, number> = {};
    (roleRows ?? []).forEach((r: any) => {
      byRole[r.role] = (byRole[r.role] ?? 0) + 1;
    });
    return { totalUsers: total ?? 0, byRole, bookshops: shops ?? 0 };
  });

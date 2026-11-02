import { createServerFn } from "@tanstack/react-start";

const ROLES = ["Shopper", "Merchant", "Developer"] as const;

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: { email?: string; role?: string }) => {
    const email = (input.email ?? "").trim().toLowerCase();
    const role = input.role ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) throw new Error("Enter a valid email.");
    if (!ROLES.includes(role as (typeof ROLES)[number])) throw new Error("Choose a role.");
    return { email, role };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      create table if not exists fba_waitlist (
        email text primary key,
        role text not null,
        created_at timestamptz not null default now()
      )
    `;
    await sql`
      insert into fba_waitlist (email, role)
      values (${data.email}, ${data.role})
      on conflict (email) do update set role = excluded.role
    `;
    return { ok: true as const };
  });

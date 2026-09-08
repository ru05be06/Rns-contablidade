import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { hasAnyPermission } from "@/lib/permissions";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

/** Garante que há um usuário autenticado; redireciona para /login caso contrário. */
export async function requireSession() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/** Garante que o usuário autenticado possui ao menos uma das permissões informadas. */
export async function requirePermission(required: string | string[]) {
  const session = await requireSession();
  const needed = Array.isArray(required) ? required : [required];
  if (!hasAnyPermission(session.user.permissions, needed)) {
    redirect("/sem-permissao");
  }
  return session;
}

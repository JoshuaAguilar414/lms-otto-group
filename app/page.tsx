import { redirect } from "next/navigation";
import { getCurrentUser, isAdminRole } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(isAdminRole(user.role) ? "/admin" : "/dashboard");
}

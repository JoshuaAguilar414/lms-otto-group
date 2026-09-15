import { redirect } from "next/navigation";
import { getCurrentUser, homePath } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homePath(user));
}

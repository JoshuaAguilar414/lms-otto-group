import { isAdminRole } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";
import OttoPageShell from "@/components/OttoPageShell";

export default function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const admin = isAdminRole(user.role);
  const items = admin
    ? [
        { href: "/admin", label: "Overview" },
        { href: "/admin/participants", label: "Participants" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/courses", label: "Courses" },
        { href: "/admin/reports", label: "Reports" }
      ]
    : [
        { href: "/dashboard", label: "Overview" },
        { href: "/dashboard/courses", label: "My courses" }
      ];

  return (
    <OttoPageShell items={items} user={user}>
      {children}
    </OttoPageShell>
  );
}

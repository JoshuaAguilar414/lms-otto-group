import OttoFooter from "@/components/OttoFooter";
import OttoHeader from "@/components/OttoHeader";
import type { SessionUser } from "@/lib/types";

type NavItem = { href: string; label: string };

export default function OttoPageShell({
  items,
  user,
  showSignOut = true,
  children
}: {
  items: NavItem[];
  user?: SessionUser;
  showSignOut?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="otto-shell">
      <OttoHeader
        items={items}
        showSignOut={showSignOut}
        user={user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        } : undefined}
      />
      <main className="otto-main">{children}</main>
      <OttoFooter />
    </div>
  );
}

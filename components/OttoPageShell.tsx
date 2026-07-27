import OttoFooter from "@/components/OttoFooter";
import OttoHeader from "@/components/OttoHeader";

type NavItem = { href: string; label: string };

export default function OttoPageShell({
  items,
  showSignOut = true,
  children
}: {
  items: NavItem[];
  showSignOut?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="otto-shell">
      <OttoHeader items={items} showSignOut={showSignOut} />
      <main className="otto-main">{children}</main>
      <OttoFooter />
    </div>
  );
}

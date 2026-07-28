"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type UserMenuUser = {
  firstName: string;
  lastName: string;
  email: string;
};

function getInitial(firstName: string, lastName: string) {
  const letter = firstName.trim()[0] || lastName.trim()[0] || "?";
  return letter.toUpperCase();
}

function getDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim() || "User";
}

export default function UserMenu({
  user,
  profileHref = "/dashboard/profile",
  variant = "header"
}: {
  user: UserMenuUser;
  profileHref?: string;
  variant?: "header" | "panel";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = getInitial(user.firstName, user.lastName);
  const displayName = getDisplayName(user.firstName, user.lastName);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (variant === "panel") {
    return (
      <div className="otto-user-menu-panel">
        <div className="otto-user-menu-panel-head">
          <span className="otto-user-avatar" aria-hidden="true">{initial}</span>
          <div>
            <div className="otto-user-menu-name">{displayName}</div>
            <div className="otto-user-menu-email">{user.email}</div>
          </div>
        </div>
        <Link
          href={profileHref}
          className={`otto-user-menu-item${pathname === profileHref ? " active" : ""}`}
          onClick={() => setOpen(false)}
        >
          Profile
        </Link>
        <button
          type="button"
          className="otto-user-menu-item"
          disabled={busy}
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="otto-user-menu" ref={rootRef}>
      <button
        type="button"
        className="otto-user-menu-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="otto-user-avatar" aria-hidden="true">{initial}</span>
      </button>

      {open && (
        <div className="otto-user-menu-dropdown" role="menu">
          <div className="otto-user-menu-dropdown-head">
            <span className="otto-user-avatar" aria-hidden="true">{initial}</span>
            <div>
              <div className="otto-user-menu-name">{displayName}</div>
              <div className="otto-user-menu-email">{user.email}</div>
            </div>
          </div>
          <Link
            href={profileHref}
            className={`otto-user-menu-item${pathname === profileHref ? " active" : ""}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <button
            type="button"
            className="otto-user-menu-item"
            role="menuitem"
            disabled={busy}
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

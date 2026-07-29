"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import UserMenu from "@/components/UserMenu";
import OttoLogo from "@/components/OttoLogo";

type NavItem = { href: string; label: string };
type HeaderUser = { firstName: string; lastName: string; email: string };

const OTTO_GROUP_HOME = "https://www.ottogroup.com/en/";
const OTTO_GROUP_SEARCH = "https://www.ottogroup.com/en/search/";

function SearchIcon() {
  return (
    <svg className="otto-header-search-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.25" cy="10.25" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M15.25 15.25 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function OttoHeader({
  items,
  user,
  showSignOut = true
}: {
  items: NavItem[];
  user?: HeaderUser;
  showSignOut?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();
    window.location.href = `${OTTO_GROUP_SEARCH}?searchTerm=${encodeURIComponent(query)}`;
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={`otto-header${menuOpen ? " otto-header-open" : ""}`}>
      <div className="otto-header-inner">
        <div className="otto-header-brand">
          <a
            href={OTTO_GROUP_HOME}
            className="otto-header-logo"
            onClick={() => setMenuOpen(false)}
          >
            <OttoLogo className="otto-logo-header" />
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/otto-partners-logos.png"
            alt="bonprix, OTTO, Crate&Barrel, Witt-Gruppe"
            className="otto-header-partners"
          />
        </div>

        <div className="otto-header-search">
          <form className="otto-header-search-form" onSubmit={submitSearch}>
            <button type="submit" className="otto-header-search-btn" aria-label="Search">
              <SearchIcon />
            </button>
            <input
              type="search"
              className="otto-header-search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search Otto Group"
            />
          </form>
        </div>

        <div className="otto-header-actions">
          <nav className="otto-header-nav" aria-label="Primary">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`otto-header-link${pathname === item.href ? " active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {showSignOut && user && (
            <div className="otto-header-user">
              <UserMenu user={user} />
            </div>
          )}

          <button
            type="button"
            className="otto-header-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="otto-header-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="otto-header-menu-label">Menu</span>
            <span className="otto-header-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="otto-header-backdrop"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <nav
        id="otto-header-menu"
        className={`otto-header-panel${menuOpen ? " open" : ""}`}
        aria-label="Mobile menu"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`otto-header-panel-link${pathname === item.href ? " active" : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        {showSignOut && user && (
          <div className="otto-header-panel-user">
            <UserMenu user={user} variant="panel" />
          </div>
        )}
      </nav>
    </header>
  );
}

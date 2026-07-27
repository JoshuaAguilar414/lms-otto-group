"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import OttoLogo from "@/components/OttoLogo";

type NavItem = { href: string; label: string };

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
  showSignOut = true
}: {
  items: NavItem[];
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
        <a
          href={OTTO_GROUP_HOME}
          className="otto-header-logo"
          onClick={() => setMenuOpen(false)}
        >
          <OttoLogo className="otto-logo-header" />
        </a>

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

          {showSignOut && (
            <div className="otto-header-signout">
              <LogoutButton />
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
        {showSignOut && (
          <div className="otto-header-panel-signout">
            <LogoutButton />
          </div>
        )}
      </nav>
    </header>
  );
}

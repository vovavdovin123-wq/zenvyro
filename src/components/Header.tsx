"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import "./header.css";

const links = [
  { href: "/works", label: "Кейсы" },
  { href: "/team", label: "Люди" },
  { href: "/process", label: "Процесс" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`zn-nav ${scrolled ? "zn-nav-scrolled" : ""}`}>
      <div className="zn-nav-inner">
        <div className="zn-nav-left">
          <span className="md:hidden">
            <Logo compact />
          </span>
          <span className="hidden md:block">
            <Logo />
          </span>
          <span className="zn-nav-divider" aria-hidden>
            /
          </span>
          <nav className="zn-nav-links">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="zn-nav-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="zn-nav-right">
          <Link href="/contact" className="zn-nav-pro">
            Обсудить
          </Link>
          <button
            type="button"
            aria-label="Меню"
            aria-expanded={open}
            className={`zn-nav-hamburger ${open ? "open" : ""}`}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {open ? (
          <div className="zn-nav-mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)}>
              Обсудить
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}

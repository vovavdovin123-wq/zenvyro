"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CardNav, type CardNavItem } from "@/components/bits/CardNav";
import { Logo } from "./Logo";
import "@/styles/header.css";

const links = [
  { href: "/works", label: "Кейсы" },
  { href: "/team", label: "Люди" },
  { href: "/process", label: "Процесс" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const mobileItems = useMemo<CardNavItem[]>(
    () => [
      {
        label: "Кейсы",
        bgColor: "#a855f7",
        textColor: "#fff",
        links: [{ label: "Работы", href: "/works", ariaLabel: "Кейсы" }],
      },
      {
        label: "Студия",
        bgColor: "#1a1524",
        textColor: "#f2f1f7",
        links: [
          { label: "Люди", href: "/team", ariaLabel: "Команда" },
          { label: "Процесс", href: "/process", ariaLabel: "Процесс" },
        ],
      },
      {
        label: "Связь",
        bgColor: "#f2f1f7",
        textColor: "#120f17",
        links: [
          { label: "Обсудить", href: "/contact", ariaLabel: "Оставить заявку" },
          { label: "Реквизиты", href: "/requisites", ariaLabel: "Контакты и реквизиты" },
        ],
      },
    ],
    [],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <CardNav logo={<Logo compact />} items={mobileItems} ctaHref="/contact" ctaLabel="Обсудить" />
      <header className={`zn-nav ${scrolled ? "zn-nav-scrolled" : ""}`}>
        <div className="zn-nav-inner">
          <div className="zn-nav-left">
            <Logo />
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
          </div>
        </div>
      </header>
    </>
  );
}

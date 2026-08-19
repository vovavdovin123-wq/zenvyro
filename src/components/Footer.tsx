import Link from "next/link";
import { Logo } from "./Logo";
import { legalDocs, legalEntity } from "@/lib/legal";
import "./landing.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="zn-foot">
      <div className="zn-foot-line" />
      <div className="zn-inner">
        <div className="zn-foot-grid">
          <div className="zn-foot-brand">
            <Logo withTagline />
            <p className="zn-foot-tag">{legalEntity.tagline}</p>
          </div>
          <nav className="zn-foot-col" aria-label="Студия">
            <p>Студия</p>
            <Link href="/works">Кейсы</Link>
            <Link href="/team">Люди</Link>
            <Link href="/process">Процесс</Link>
            <Link href="/contact">Обсудить</Link>
          </nav>
          <nav className="zn-foot-col" aria-label="Документы">
            <p>Документы</p>
            {legalDocs.map((doc) => (
              <Link key={doc.href} href={doc.href}>
                {doc.title}
              </Link>
            ))}
          </nav>
          <div className="zn-foot-col">
            <p>Контакты</p>
            <span className="zn-foot-plain">{legalEntity.shortName}</span>
            <a href={`mailto:${legalEntity.email}`}>{legalEntity.email}</a>
            <Link href="/contacts">Контакты и реквизиты</Link>
          </div>
        </div>
        <div className="zn-foot-bottom">
          <p>
            © {year} {legalEntity.brand}
          </p>
          <p>Оператор ПДн: реестр РКН № {legalEntity.pdnRegistry}</p>
        </div>
      </div>
    </footer>
  );
}

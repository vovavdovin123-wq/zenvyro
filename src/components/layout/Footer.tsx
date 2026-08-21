import Link from "next/link";
import { Logo } from "./Logo";
import { legalEntity } from "@/content/legal";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="zn-foot">
      <div className="zn-foot-line" />
      <div className="zn-inner">
        <div className="zn-foot-grid zn-foot-grid--compact">
          <div className="zn-foot-brand">
            <Logo withTagline />
            <p className="zn-foot-tag">{legalEntity.tagline}</p>
          </div>
          <nav className="zn-foot-col" aria-label="Подвал">
            <Link href="/contact">Обсудить проект</Link>
            <Link href="/requisites">Документы и контакты</Link>
          </nav>
        </div>
        <div className="zn-foot-bottom">
          <p>
            © {year} {legalEntity.brand}
          </p>
        </div>
      </div>
    </footer>
  );
}

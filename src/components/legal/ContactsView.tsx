import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalDocs, legalEntity } from "@/content/legal";

export function ContactsView() {
  return (
    <LegalPage
      kicker="Студия"
      title="Документы и контакты"
      lead="Реквизиты, почта и юридические документы. Заявки — через форму на сайте."
    >
      <div className="zn-legal-grid">
        <article className="zn-legal-card">
          <h2>Оператор (ИП)</h2>
          <dl className="zn-legal-dl">
            <div>
              <dt>Наименование</dt>
              <dd>{legalEntity.fullName}</dd>
            </div>
            <div>
              <dt>Сокращённо</dt>
              <dd>{legalEntity.shortName}</dd>
            </div>
            <div>
              <dt>ИНН</dt>
              <dd>{legalEntity.inn}</dd>
            </div>
            <div>
              <dt>ОГРНИП</dt>
              <dd>{legalEntity.ogrnip}</dd>
            </div>
            <div>
              <dt>Дата регистрации ИП</dt>
              <dd>{legalEntity.registeredAt}</dd>
            </div>
            <div>
              <dt>Регион регистрации</dt>
              <dd>{legalEntity.region}</dd>
            </div>
            <div>
              <dt>Реестр операторов ПДн</dt>
              <dd>Роскомнадзор № {legalEntity.pdnRegistry}</dd>
            </div>
            <div>
              <dt>Ответственный за ПДн</dt>
              <dd>{legalEntity.pdnOfficer}</dd>
            </div>
          </dl>
        </article>

        <article className="zn-legal-card">
          <h2>Связь</h2>
          <dl className="zn-legal-dl">
            <div>
              <dt>E-mail</dt>
              <dd>
                <a className="zn-legal-mail" href={`mailto:${legalEntity.email}`}>
                  {legalEntity.email}
                </a>
              </dd>
            </div>
          </dl>
          <p className="zn-legal-note">
            По персональным данным напишите на почту с темой «Zenvyro / Персональные данные». Ответим в срок, который
            требует 152-ФЗ — до 30 дней.
          </p>
        </article>

        <article className="zn-legal-card">
          <h2>Банковские реквизиты</h2>
          <dl className="zn-legal-dl">
            <div>
              <dt>Банк</dt>
              <dd>{legalEntity.bank}</dd>
            </div>
            <div>
              <dt>Расчётный счёт</dt>
              <dd>{legalEntity.account}</dd>
            </div>
            <div>
              <dt>БИК</dt>
              <dd>{legalEntity.bik}</dd>
            </div>
            <div>
              <dt>Корр. счёт</dt>
              <dd>{legalEntity.corrAccount}</dd>
            </div>
          </dl>
        </article>

        <article className="zn-legal-card">
          <h2>Документы</h2>
          <ul className="zn-legal-links">
            {legalDocs.map((doc) => (
              <li key={doc.href}>
                <Link href={doc.href}>{doc.title}</Link>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </LegalPage>
  );
}

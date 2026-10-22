import { getMessages } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { listAuditEvents } from "@/server/audit/list-audit-events";

export default async function AuditPage() {
  const locale = await getLocale();
  const text = getMessages(locale);
  const result = await listAuditEvents(locale);
  const dateTime = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const recordLabels: Record<string, string> = {
    transactions: text.audit.transaction,
    account_reconciliations: text.audit.reconciliation,
    organization_memberships: text.audit.member,
  };

  return (
    <>
      <p className="eyebrow">{text.audit.eyebrow}</p>
      <h1>{text.audit.title}</h1>
      <p className="lede">{text.audit.lede}</p>

      {!result.ok ? (
        <section className="state-panel" role="alert">
          <h2>{text.audit.unavailable}</h2>
          <p>{text.audit.restricted}</p>
        </section>
      ) : result.events.length === 0 ? (
        <section className="state-panel">
          <h2>{text.audit.empty}</h2>
          <p>{text.audit.emptyText}</p>
        </section>
      ) : (
        <div className="table-wrap audit-table-wrap">
          <table className="activity-table audit-table audit-register">
            <thead>
              <tr>
                <th scope="col">{text.audit.date}</th>
                <th scope="col">{text.audit.person}</th>
                <th scope="col">{text.audit.activity}</th>
                <th scope="col">{text.audit.details}</th>
              </tr>
            </thead>
            <tbody>
              {result.events.map((event) => (
                <tr key={event.id}>
                  <td data-label={text.audit.date}><time dateTime={event.createdAt}>{dateTime.format(new Date(event.createdAt))}</time></td>
                  <td data-label={text.audit.person}>{event.actorEmail ?? text.audit.system}</td>
                  <td data-label={text.audit.activity}><strong>{event.description}</strong></td>
                  <td data-label={text.audit.details}>
                    {event.subject && <span>{event.subject}</span>}
                    <span className="reference">
                      {recordLabels[event.recordType] ?? text.audit.record} · {text.audit.reference} {event.recordId.slice(0, 8).toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

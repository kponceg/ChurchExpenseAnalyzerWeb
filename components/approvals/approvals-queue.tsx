"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccountLabel, getCategoryLabel, getFundLabel, type Locale } from "@/lib/i18n";

export type PendingTransaction = {
  id: string; transactionType: "income" | "expense"; transactionDate: string; amount: number; description: string;
  paymentReference: string | null; submittedAt: string; submittedBy: string; category: string; fund: string; account: string;
};

type Labels = { date: string; type: string; description: string; category: string; fund: string; account: string; amount: string; submittedBy: string; actions: string; approve: string; approving: string; reject: string; rejectionReason: string; confirmReject: string; rejecting: string; cancel: string; approved: string; rejected: string; error: string; income: string; expense: string };

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ApprovalsQueue({ locale, transactions, labels }: { locale: Locale; transactions: PendingTransaction[]; labels: Labels }) {
  const router = useRouter();
  const [reviewingId, setReviewingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const date = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", year: "numeric" });

  async function review(id: string, decision: "approve" | "reject", reason?: string) {
    setReviewingId(id); setMessage(null);
    const response = await fetch(`/api/transactions/${id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }) });
    const result = await response.json();
    if (!response.ok) setMessage({ type: "error", text: locale === "es" ? labels.error : (result.error ?? labels.error) });
    else { setMessage({ type: "success", text: decision === "approve" ? labels.approved : labels.rejected }); setRejectingId(""); router.refresh(); }
    setReviewingId("");
  }

  return <>
    {message && <p className={`message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</p>}
    <div className="table-wrap"><table className="activity-table"><thead><tr><th>{labels.date}</th><th>{labels.type}</th><th>{labels.description}</th><th>{labels.category}</th><th>{labels.fund}</th><th>{labels.account}</th><th>{labels.amount}</th><th>{labels.submittedBy}</th><th>{labels.actions}</th></tr></thead><tbody>
      {transactions.map((transaction) => <tr key={transaction.id}>
        <td>{date.format(new Date(`${transaction.transactionDate}T00:00:00`))}</td>
        <td><span className={`transaction-type ${transaction.transactionType}`}>{transaction.transactionType === "income" ? labels.income : labels.expense}</span></td>
        <td><strong>{transaction.description}</strong>{transaction.paymentReference && <span className="reference">{transaction.paymentReference}</span>}</td>
        <td>{getCategoryLabel(locale, transaction.category)}</td><td>{getFundLabel(locale, transaction.fund)}</td><td>{getAccountLabel(locale, transaction.account)}</td>
        <td className={`amount ${transaction.transactionType === "income" ? "positive" : "negative"}`}>{transaction.transactionType === "income" ? "+" : "−"}{currency.format(transaction.amount)}</td>
        <td><span className="reference">{transaction.submittedBy.slice(0, 8).toUpperCase()}</span></td>
        <td>{rejectingId === transaction.id ? <form className="approval-reject-form" onSubmit={(event) => { event.preventDefault(); void review(transaction.id, "reject", String(new FormData(event.currentTarget).get("reason") ?? "")); }}>
          <label htmlFor={`rejection-${transaction.id}`}>{labels.rejectionReason}</label><textarea id={`rejection-${transaction.id}`} name="reason" minLength={3} maxLength={160} required />
          <div className="actions"><button className="danger-button" disabled={reviewingId === transaction.id}>{reviewingId === transaction.id ? labels.rejecting : labels.confirmReject}</button><button className="secondary-button" type="button" onClick={() => setRejectingId("")}>{labels.cancel}</button></div>
        </form> : <div className="approval-actions"><button className="primary" type="button" disabled={reviewingId === transaction.id} onClick={() => review(transaction.id, "approve")}>{reviewingId === transaction.id ? labels.approving : labels.approve}</button><button className="danger-button" type="button" disabled={reviewingId === transaction.id} onClick={() => setRejectingId(transaction.id)}>{labels.reject}</button></div>}</td>
      </tr>)}
    </tbody></table></div>
  </>;
}

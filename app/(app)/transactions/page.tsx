import Link from "next/link";

export default function TransactionsPage() {
  return <><p className="eyebrow">Transactions</p><h1>Transaction register</h1><p className="lede">The first available transaction workflow is income entry.</p><Link className="primary" href="/transactions/new">Record income</Link></>;
}

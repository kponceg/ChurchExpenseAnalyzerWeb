import { IncomeTransactionForm } from "@/components/transactions/income-transaction-form";

export default function NewTransactionPage() {
  return (
    <>
      <p className="eyebrow">Transactions</p>
      <h1>Record income</h1>
      <p className="lede">Enter the deposit details below. The server validates the financial information before presenting a review.</p>
      <IncomeTransactionForm />
    </>
  );
}

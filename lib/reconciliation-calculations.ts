export type ReconciliationAmount = {
  transactionType: "income" | "expense";
  amount: string | number;
  cleared: boolean;
};

export function decimalToCents(value: string | number) {
  const normalized = String(value).trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Money values must contain no more than two decimal places.");
  const negative = normalized.startsWith("-");
  const [whole, fraction = ""] = (negative ? normalized.slice(1) : normalized).split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}

export function calculateReconciliation(beginningBalance: string | number, statementEndingBalance: string | number, transactions: ReconciliationAmount[]) {
  const clearedActivity = transactions
    .filter((transaction) => transaction.cleared)
    .reduce((total, transaction) => {
      const amount = decimalToCents(transaction.amount);
      return total + (transaction.transactionType === "income" ? amount : -amount);
    }, 0n);
  const clearedBalance = decimalToCents(beginningBalance) + clearedActivity;
  const difference = decimalToCents(statementEndingBalance) - clearedBalance;
  return { clearedActivity, clearedBalance, difference };
}

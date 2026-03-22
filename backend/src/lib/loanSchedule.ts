export type LoanRepaymentRecord = {
  id: string;
  amount: number;
  payment_method: string | null;
  payment_ref: string | null;
  phone_number: string | null;
  note: string | null;
  created_at: string;
};

export type LoanScheduleRow = {
  paymentNumber: number;
  paymentDate: string;
  beginningBalance: number;
  scheduledPayment: number;
  principal: number;
  interest: number;
  endingBalance: number;
  cumulativeInterest: number;
};

export type LoanScheduleSummary = {
  principal: number;
  annualInterestRate: number;
  scheduledPayment: number;
  scheduledNumberOfPayments: number;
  actualNumberOfPayments: number;
  paymentsPerYear: number;
  startDate: string;
  totalInterest: number;
  totalPayable: number;
  totalRepaid: number;
  remainingBalance: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function getLoanPrincipal(approvedAmount: number | null | undefined, requestedAmount: number | null | undefined) {
  return roundMoney(Number(approvedAmount ?? requestedAmount ?? 0));
}

export function getLoanPaymentCount(repaymentDays: number | null | undefined) {
  return Math.max(1, Math.ceil(Number(repaymentDays ?? 30) / 30));
}

export function getLoanStartDate(value: string | null | undefined) {
  return value ?? new Date().toISOString();
}

export function buildLoanSchedule(input: {
  approvedAmount: number | null | undefined;
  requestedAmount: number | null | undefined;
  interestRate: number | null | undefined;
  repaymentDays: number | null | undefined;
  startDate: string | null | undefined;
  repayments?: LoanRepaymentRecord[];
}) {
  const principal = getLoanPrincipal(input.approvedAmount, input.requestedAmount);
  const annualInterestRate = Number(input.interestRate ?? 0);
  const scheduledNumberOfPayments = getLoanPaymentCount(input.repaymentDays);
  const periodicRate = annualInterestRate > 0 ? annualInterestRate / 100 / 12 : 0;
  const startDate = getLoanStartDate(input.startDate);

  const scheduledPayment = principal <= 0
    ? 0
    : periodicRate === 0
      ? roundMoney(principal / scheduledNumberOfPayments)
      : roundMoney((principal * periodicRate) / (1 - Math.pow(1 + periodicRate, -scheduledNumberOfPayments)));

  const schedule: LoanScheduleRow[] = [];
  let beginningBalance = principal;
  let cumulativeInterest = 0;

  for (let index = 0; index < scheduledNumberOfPayments; index += 1) {
    const interest = roundMoney(beginningBalance * periodicRate);
    const principalPayment = index === scheduledNumberOfPayments - 1
      ? roundMoney(beginningBalance)
      : roundMoney(Math.max(scheduledPayment - interest, 0));
    const scheduledPaymentForRow = roundMoney(principalPayment + interest);
    const endingBalance = roundMoney(Math.max(beginningBalance - principalPayment, 0));
    cumulativeInterest = roundMoney(cumulativeInterest + interest);

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + index);

    schedule.push({
      paymentNumber: index + 1,
      paymentDate: paymentDate.toISOString(),
      beginningBalance,
      scheduledPayment: scheduledPaymentForRow,
      principal: principalPayment,
      interest,
      endingBalance,
      cumulativeInterest,
    });

    beginningBalance = endingBalance;
  }

  const totalInterest = roundMoney(schedule.reduce((sum, row) => sum + row.interest, 0));
  const totalPayable = roundMoney(principal + totalInterest);
  const repayments = input.repayments ?? [];
  const totalRepaid = roundMoney(repayments.reduce((sum, repayment) => sum + Number(repayment.amount ?? 0), 0));
  const remainingBalance = roundMoney(Math.max(totalPayable - totalRepaid, 0));

  return {
    summary: {
      principal,
      annualInterestRate,
      scheduledPayment,
      scheduledNumberOfPayments,
      actualNumberOfPayments: repayments.length,
      paymentsPerYear: 12,
      startDate,
      totalInterest,
      totalPayable,
      totalRepaid,
      remainingBalance,
    } satisfies LoanScheduleSummary,
    schedule,
  };
}

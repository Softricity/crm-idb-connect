export enum FinancialStatus {
  PENDING = 'PENDING',
  SENT_TO_UNIVERSITY = 'SENT_TO_UNIVERSITY',
  UNDER_PROCESS = 'UNDER_PROCESS',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export interface FinancialNote {
  id: string;
  stage: FinancialStatus;
  content: string;
  created_at: string;
  partner: {
    name: string;
  };
}

export interface FinancialRecord {
  id: string;
  status: FinancialStatus;
  notes: FinancialNote[];
}

export const FINANCIAL_STAGES = [
  { key: FinancialStatus.PENDING, label: 'Financials Pending', step: 1 },
  { key: FinancialStatus.SENT_TO_UNIVERSITY, label: 'Financials Sent to the University', step: 2 },
  { key: FinancialStatus.UNDER_PROCESS, label: 'Financials Under Process with the University', step: 3 },
  { key: FinancialStatus.APPROVED, label: 'Financials Approved', step: 4 },
  { key: FinancialStatus.DECLINED, label: 'Financials Declined', step: 5 },
];
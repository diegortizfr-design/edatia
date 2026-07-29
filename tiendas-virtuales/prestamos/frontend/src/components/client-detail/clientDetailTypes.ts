export interface Amortization {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
  paidAt: string | null;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  notes: string | null;
}

export interface Loan {
  id: string;
  loanNumber: string;
  principal: number;
  interestRate: number;
  interestAmount: number;
  totalAmount: number;
  balance: number;
  paymentFrequency: string;
  installments: number;
  installmentAmt: number;
  status: string;
  startDate: string;
  endDate: string;
  renewalFromId: string | null;
  amortizations: Amortization[];
  payments: Payment[];
}

export interface CustomDocAttachment {
  id: string;
  title: string;
  type: 'image' | 'pdf';
  url: string;
  date: string;
}

export interface ClientFullDetails {
  id: string;
  name: string;
  documentId: string;
  phone: string;
  address: string;
  email: string | null;
  status: string;
  defaultFrequency?: string;
  idFront?: string | null;
  idBack?: string | null;
  photo?: string | null;
  attachmentsJson?: string | null;
  loans: Loan[];
}

export interface PrintInvoiceData {
  client: ClientFullDetails;
  loan: Loan;
  isRenewal?: boolean;
  excedente?: number;
  debtSettled?: number;
}

export interface PrintReceiptData {
  clientName?: string;
  documentId?: string;
  loanNumber?: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  remainingBalance: number;
}

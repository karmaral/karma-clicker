export type PhaseKind = 'light' | 'dense';

export interface Phase {
  kind: PhaseKind;
  at: string;
}

export type PurchaseMode = '1' | '10' | 'Next' | 'Max';

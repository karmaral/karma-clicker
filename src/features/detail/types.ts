export type PhaseKind = 'light' | 'dense';

export interface Phase {
  kind: PhaseKind;
  at: string;
}

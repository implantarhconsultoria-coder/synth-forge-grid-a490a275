// Legacy types referenced by unused modules (kept to satisfy TypeScript).
export interface Employee {
  id: string;
  name?: string;
  vrValue: number;
  vtValue: number;
  [key: string]: any;
}
export interface Absence {
  id: string;
  reason?: string;
  [key: string]: unknown;
}

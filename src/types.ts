// Legacy types referenced by unused modules (kept to satisfy TypeScript).
export interface Employee {
  id: string;
  name?: string;
  [key: string]: unknown;
}
export interface Absence {
  id: string;
  reason?: string;
  [key: string]: unknown;
}

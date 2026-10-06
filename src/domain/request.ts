export type DemoCategory = 'legal' | 'accounting' | 'tax' | 'development';
export type DemoUrgency = 'normal' | 'urgent';
export type DemoRequestStatus =
  | 'draft'
  | 'searching'
  | 'offered'
  | 'accepted'
  | 'answered'
  | 'completed';

export interface DemoRequestInput {
  category: DemoCategory;
  question: string;
  context: string;
  country: 'France';
  language: 'fr';
  urgency: DemoUrgency;
}

export interface DemoExpert {
  id: string;
  displayName: string;
  profession: string;
  specialty: string;
  verified: boolean;
  etaMinutes: number;
}

export interface DemoRequest extends DemoRequestInput {
  id: string;
  createdAt: string;
  status: DemoRequestStatus;
  expert?: DemoExpert;
  answer?: string;
}

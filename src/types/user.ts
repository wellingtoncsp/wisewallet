export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  birthDate: string;
  cpf?: string;
  gender?: 'male' | 'female' | 'other' | '';
  currency: 'BRL' | 'USD' | 'EUR' | 'GBP';
  createdAt: Date;
  updatedAt: Date;
  familyId?: string;
  isHeadOfFamily?: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'head' | 'member';
  joinedAt: Date;
}

export type Gender = 'male' | 'female' | 'other';
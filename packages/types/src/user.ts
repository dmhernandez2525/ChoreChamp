// User types

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface CoppaConsent {
  id: string;
  userId: string;
  consentType: 'credit_card' | 'government_id' | 'knowledge_based';
  verifiedAt: Date;
  ipAddress: string | null;
  createdAt: Date;
}

// API Request/Response types
export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

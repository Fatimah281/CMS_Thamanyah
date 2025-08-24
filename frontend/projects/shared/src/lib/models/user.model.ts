export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  role?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

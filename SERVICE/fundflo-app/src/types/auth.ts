// User-related types
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
  }
  
  export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    MANAGER = 'MANAGER'
  }
  
  // Authentication-related types
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    name: string;
  }
  
  export interface AuthResponse {
    user: User;
    token: string;
  }
  
  export interface ResetPasswordData {
    token: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface ForgotPasswordData {
    email: string;
  }
  
  // Session-related types
  export interface Session {
    userId: string;
    expiresAt: string;
    issuedAt: string;
  }
  
  // Permission-related types
  export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete';
  }
  
  export interface PermissionGroup {
    name: string;
    permissions: Permission[];
  }
  
  // Auth state for Redux store
  export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  }
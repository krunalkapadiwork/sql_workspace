export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  adminId?: string | null;
  designationId?: string | null;
  mustChangePassword?: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthenticatedUser;
    }
  }
}


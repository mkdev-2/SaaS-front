export interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    message?: string;
    code?: string;
    errors?: any[];
  }
  
  export interface AuthData {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    token: string;
    message: string;
  }
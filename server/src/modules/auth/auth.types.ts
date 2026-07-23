export interface LoginDto {
  phone: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  phone: string;
  password: string;
  status: string;
  roles: string[];
}
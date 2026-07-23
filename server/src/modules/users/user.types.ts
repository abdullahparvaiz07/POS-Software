export interface CreateUserDto {
  fullName: string;
  phone: string;
  email?: string;
  password?: string;
  address?: string;
  salary?: number;
  joiningDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  profilePhoto?: string;
  roles?: number[]; // Role IDs
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

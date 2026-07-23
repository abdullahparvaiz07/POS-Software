import { Prisma } from "@prisma/client";
import { userRepository } from "./user.repository";
import { CreateUserDto, UpdateUserDto } from "./user.types";
import { hashPassword } from "../../utils/hash";
import auditService from "../audit/audit.service";

export class UserService {
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: number;
    status?: "ACTIVE" | "INACTIVE";
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    return userRepository.findAll({
      skip,
      take: limit,
      search: params.search,
      roleId: params.roleId ? Number(params.roleId) : undefined,
      status: params.status,
    });
  }

  async getUserById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async createUser(data: CreateUserDto, actorId: number) {
    // Validate uniqueness
    if (data.email) {
      const existingEmail = await userRepository.findByEmail(data.email);
      if (existingEmail) throw new Error("Email already in use");
    }
    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) throw new Error("Phone number already in use");

    let hashedPassword = "";
    if (data.password) {
      hashedPassword = await hashPassword(data.password);
    } else {
      // Default password or generate random
      hashedPassword = await hashPassword("password123");
    }

    const { roles, ...userData } = data;

    const createData: Prisma.UserCreateInput = {
      fullName: userData.fullName,
      phone: userData.phone,
      email: userData.email,
      password: hashedPassword,
      address: userData.address,
      salary: userData.salary,
      joiningDate: userData.joiningDate ? new Date(userData.joiningDate) : new Date(),
      status: userData.status || 'ACTIVE',
      profilePhoto: userData.profilePhoto,
    };

    if (roles && roles.length > 0) {
      createData.userRoles = {
        create: roles.map((roleId) => ({ roleId })),
      };
    }

    const newUser = await userRepository.create(createData);

    await auditService.logEvent({
      userId: actorId,
      module: "User",
      action: "Create",
      entityId: newUser.id,
      description: `Created user ${newUser.fullName}`,
      newData: newUser,
    });

    return newUser;
  }

  async updateUser(id: number, data: UpdateUserDto, actorId: number) {
    const existingUser = await this.getUserById(id);

    if (data.email && data.email !== existingUser.email) {
      const emailCheck = await userRepository.findByEmail(data.email);
      if (emailCheck) throw new Error("Email already in use");
    }
    if (data.phone && data.phone !== existingUser.phone) {
      const phoneCheck = await userRepository.findByPhone(data.phone);
      if (phoneCheck) throw new Error("Phone number already in use");
    }

    const updateData: Prisma.UserUpdateInput = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      salary: data.salary,
      status: data.status,
      profilePhoto: data.profilePhoto,
    };

    if (data.joiningDate) {
      updateData.joiningDate = new Date(data.joiningDate);
    }

    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    if (data.roles) {
      updateData.userRoles = {
        deleteMany: {},
        create: data.roles.map((roleId) => ({ roleId })),
      };
    }

    const updatedUser = await userRepository.update(id, updateData);

    await auditService.logEvent({
      userId: actorId,
      module: "User",
      action: "Update",
      entityId: updatedUser.id,
      description: `Updated user ${updatedUser.fullName}`,
      oldData: existingUser,
      newData: updatedUser,
    });

    return updatedUser;
  }

  async deleteUser(id: number, actorId: number) {
    const existingUser = await this.getUserById(id);

    // Prevent deleting the last Admin
    const isAdmin = existingUser.userRoles.some((ur: any) => ur.role.name === 'ADMIN');
    if (isAdmin) {
      const adminCount = await userRepository.getAdminCount();
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last administrator");
      }
    }

    const deletedUser = await userRepository.softDelete(id, actorId);

    await auditService.logEvent({
      userId: actorId,
      module: "User",
      action: "Delete",
      entityId: id,
      description: `Soft deleted user ${existingUser.fullName}`,
      oldData: existingUser,
    });

    return deletedUser;
  }

  async restoreUser(id: number, actorId: number) {
    const user = await userRepository.restore(id);

    await auditService.logEvent({
      userId: actorId,
      module: "User",
      action: "Restore",
      entityId: id,
      description: `Restored user ID ${id}`,
    });

    return user;
  }
}

export const userService = new UserService();

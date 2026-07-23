import prisma from "../../config/prisma";

export class AuthRepository {
  /**
   * Find user by phone number
   */
  async findUserByPhone(phone: string) {
    return prisma.user.findUnique({
      where: {
        phone,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(id: number) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}


export default new AuthRepository();
import authRepository from "./auth.repository";
import { comparePassword } from "../../utils/hash";
import { generateToken } from "../../utils/jwt";
import { AUTH_MESSAGES } from "./auth.constants";
import { LoginDto } from "./auth.types";
import { UnauthorizedError, ForbiddenError } from "../../errors";

class AuthService {
  async login(data: LoginDto) {
    // 1. Find user
    const user = await authRepository.findUserByPhone(data.phone);

    if (!user) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // 2. Check account status
    if (user.status !== "ACTIVE") {
      throw new ForbiddenError(AUTH_MESSAGES.ACCOUNT_INACTIVE);
    }

    // 3. Compare password
    const isPasswordValid = await comparePassword(
      data.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // 4. Extract role names
    const roles = user.userRoles.map((userRole) => userRole.role.name);

    // 5. Generate JWT
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      roles,
    });

    // 6. Return response
    return {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        roles,
      },
    };
  }
}

export default new AuthService();
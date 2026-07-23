import roleRepository from './roles.repository';
import { NotFoundError } from '../../errors';

export class RoleService {
  async getAllRoles() {
    return roleRepository.findAll();
  }

  async getRoleById(id: number) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }
    return role;
  }
}

export default new RoleService();

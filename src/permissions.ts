export type Profile = "admin" | "filial" | "tecnico_campo" | "operacional" | "usuario_cpf";

interface Permission {
  canAccessAdminPanel: boolean;
  canManageFiliais: boolean;
  canRegisterTecnicoCampo: boolean;
  canAccessOperacional: boolean;
  canAccessUsuarioPorCPF: boolean;
}

const permissionsByProfile: Record<Profile, Permission> = {
  admin: {
    canAccessAdminPanel: true,
    canManageFiliais: true,
    canRegisterTecnicoCampo: true,
    canAccessOperacional: true,
    canAccessUsuarioPorCPF: true
  },
  filial: {
    canAccessAdminPanel: false,
    canManageFiliais: false,
    canRegisterTecnicoCampo: false,
    canAccessOperacional: true,
    canAccessUsuarioPorCPF: true
  },
  tecnico_campo: {
    canAccessAdminPanel: false,
    canManageFiliais: false,
    canRegisterTecnicoCampo: true,
    canAccessOperacional: true,
    canAccessUsuarioPorCPF: false
  },
  operacional: {
    canAccessAdminPanel: false,
    canManageFiliais: false,
    canRegisterTecnicoCampo: false,
    canAccessOperacional: true,
    canAccessUsuarioPorCPF: false
  },
  usuario_cpf: {
    canAccessAdminPanel: false,
    canManageFiliais: false,
    canRegisterTecnicoCampo: false,
    canAccessOperacional: false,
    canAccessUsuarioPorCPF: true
  }
};

export function getPermissions(profile: Profile): Permission {
  return permissionsByProfile[profile];
}
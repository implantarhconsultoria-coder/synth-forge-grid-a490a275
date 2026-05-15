import { useState, useEffect } from "react";
import { Profile, getPermissions } from "../permissions";

interface UserPermissions {
  canAccessAdminPanel: boolean;
  canManageFiliais: boolean;
  canRegisterTecnicoCampo: boolean;
  canAccessOperacional: boolean;
  canAccessUsuarioPorCPF: boolean;
}

export function useUserPermissions(profile: Profile): UserPermissions {
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessAdminPanel: false,
    canManageFiliais: false,
    canRegisterTecnicoCampo: false,
    canAccessOperacional: false,
    canAccessUsuarioPorCPF: false
  });

  useEffect(() => {
    const perms = getPermissions(profile);
    setPermissions(perms);
  }, [profile]);

  return permissions;
}
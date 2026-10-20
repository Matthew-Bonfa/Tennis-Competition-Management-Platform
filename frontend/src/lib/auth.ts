// Functions that enable us to check if a specific user has certain permissions

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem("access_token");
};

export const getRoles = (): string[] => {
  const rolesJson = localStorage.getItem("roles");
  return rolesJson ? JSON.parse(rolesJson) : [];
};

export const hasRole = (role: string): boolean => {
  return getRoles().includes(role);
};

export const isAdmin = (): boolean => {
  return hasRole("ASSOCIATION_ADMIN");
};

// Need to figure out what the role is called
export const isClubAdmin = (): boolean => {
  return hasRole("CLUB_ADMIN");
};

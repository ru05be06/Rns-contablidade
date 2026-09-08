import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    organizationId: string;
    organizationName: string;
    roleId: string;
    roleKey: string;
    roleName: string;
    permissions: string[];
  }

  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      roleId: string;
      roleKey: string;
      roleName: string;
      permissions: string[];
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string;
    organizationName: string;
    roleId: string;
    roleKey: string;
    roleName: string;
    permissions: string[];
  }
}

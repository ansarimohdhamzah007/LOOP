import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      role: string;
      workspaceId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    workspaceId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    workspaceId?: string;
  }
}
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      lab: string
    } & DefaultSession["user"]
  }

  interface User {
    lab: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    lab: string
  }
}
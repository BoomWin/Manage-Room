import { NextAuthOptions } from "next-auth"
  import CredentialsProvider from "next-auth/providers/credentials"
  import { prisma } from "./prisma"
  import bcrypt from "bcryptjs"

  export const authOptions: NextAuthOptions = {
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("이메일과 비밀번호를 입력해주세요")
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user) {
            throw new Error("등록되지 않은 이메일입니다")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("비밀번호가 일치하지 않습니다")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            lab: user.lab
          }
        }
      })
    ],
    session: {
      strategy: "jwt"
    },
    pages: {
      signIn: "/login"
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.lab = user.lab
        }
        return token
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string
          session.user.lab = token.lab as string
        }
        return session
      }
    }
  }
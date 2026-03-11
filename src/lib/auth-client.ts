import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient({
  baseURL: 'https://recall-tanstack-start.vercel.app',
})

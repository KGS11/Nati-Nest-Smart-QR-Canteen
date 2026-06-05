import { z } from "zod";

const envSchema = z.object({
  apiUrl: z.string().url(),
  socketUrl: z.string().url(),
  appUrl: z.string().url(),
});

export const env = envSchema.parse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
});

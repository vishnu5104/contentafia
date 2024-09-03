import { getServerSession, type NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "./db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { Adapter } from "next-auth/adapters";
import { accounts, sessions, users, verificationTokens } from "./schema";

const VERCEL_DEPLOYMENT = !!process.env.VERCEL_URL;
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        address: { label: "Address", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.address) return null;

        // Here you should add logic to verify the Ethereum address
        // For example, you might want to check if the address exists in your database
        // or perform additional verification steps
        // make her the address instead of email id
        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, credentials.address),
        });

        console.log("work here ", user);

        if (user) {
          return user;
        } else {
          // If the user doesn't exist, you might want to create a new user

          const newUser = await db
            .insert(users)

            .values({
              // @ts-ignore
              address: credentials.address,
              name: `User ${credentials.address.slice(0, 6)}`,
            })
            .returning();

          return newUser[0];
        }
      },
    }),
  ],
  pages: {
    signIn: `/login`,
    verifyRequest: `/login`,
    error: "/login", // Error code passed in query string as ?error=
  },
  adapter: DrizzleAdapter(db, {
    // @ts-ignore
    usersTable: users,
    // @ts-ignore
    accountsTable: accounts,
    // @ts-ignore
    sessionsTable: sessions,
    // @ts-ignore
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${VERCEL_DEPLOYMENT ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // When working on localhost, the cookie domain must be omitted entirely (https://stackoverflow.com/a/1188145)
        domain: VERCEL_DEPLOYMENT
          ? `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
          : undefined,
        secure: VERCEL_DEPLOYMENT,
      },
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user = {
        ...session.user,
        // @ts-expect-error
        id: token.sub,
        // @ts-expect-error
        username: token?.user?.username || token?.user?.gh_username,
      };
      return session;
    },
  },
};

export function getSession() {
  return getServerSession(authOptions) as Promise<{
    user: {
      id: string;
      name: string;
      username: string;
      email: string;
      image: string;
    };
  } | null>;
}

export function withSiteAuth(action: any) {
  return async (
    formData: FormData | null,
    siteId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session) {
      return {
        error: "Not authenticated",
      };
    }

    const site = await db.query.sites.findFirst({
      where: (sites, { eq }) => eq(sites.id, siteId),
    });

    if (!site || site.userId !== session.user.id) {
      return {
        error: "Not authorized",
      };
    }

    return action(formData, site, key);
  };
}

export function withPostAuth(action: any) {
  return async (
    formData: FormData | null,
    postId: string,
    key: string | null,
  ) => {
    const session = await getSession();
    if (!session?.user.id) {
      return {
        error: "Not authenticated",
      };
    }

    const post = await db.query.posts.findFirst({
      where: (posts, { eq }) => eq(posts.id, postId),
      with: {
        site: true,
      },
    });

    if (!post || post.userId !== session.user.id) {
      return {
        error: "Post not found",
      };
    }

    return action(formData, post, key);
  };
}

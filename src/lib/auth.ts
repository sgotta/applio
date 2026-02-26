import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // allowDangerousEmailAccountLinking: link Google + GitHub accounts
    // with the same email to a single user (Supabase did this by default).
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "database" },
  pages: {
    signIn: "/editor",
  },
  callbacks: {
    async signIn({ user, profile }) {
      const profileImage =
        (profile?.picture as string | undefined) ??
        (profile?.avatar_url as string | undefined);

      if (user.id && profileImage && profileImage !== user.image) {
        const client = await clientPromise;
        const db = client.db();
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(user.id) },
            { $set: { image: profileImage } },
          );
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});

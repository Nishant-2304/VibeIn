import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let isNewUser = false;
    if (user) {
      const existingUser = await prisma.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!existingUser) {
        const rawUsername = (user.user_metadata.full_name || user.email?.split("@")[0] || "user").trim();
        const baseUsername = rawUsername || "user";
        let username = baseUsername;
        let isUnique = false;
        let suffix = 1;

        while (!isUnique) {
          const u = await prisma.user.findUnique({
            where: { username },
          });
          if (!u) {
            isUnique = true;
          } else {
            username = `${baseUsername}${suffix}`;
            suffix++;
          }
        }

        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email!,
            username,
          },
        });

        console.log("User created");
        isNewUser = true;
      } else {
        console.log("User already exists");
      }
    }
    //console.log(user);
    if (isNewUser) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(origin);
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  // 1. Sign up user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Mirror user in Prisma DB to maintain referential integrity
  if (data.user) {
    try {
      await prisma.user.create({
        data: {
          id: data.user.id, // Use the exact same UUID as Supabase
          email: data.user.email!,
          name: name || "",
          role: "USER", // Default role
        },
      });
    } catch (dbError: any) {
      console.error("Failed to insert user to DB:", dbError);
      // Even if DB fails, we should handle it, but for B2B it's critical.
      // In production, you'd want compensation logic here.
      return { error: "Account created in Auth, but failed to sync to Database." };
    }
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  return { success: true };
}

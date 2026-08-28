"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-zinc-800"
    >
      Logout
    </button>
  );
}
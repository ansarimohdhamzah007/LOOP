import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">
                LOOP Dashboard
              </h1>

              <p className="mt-2 text-zinc-500">
                Feedback management workspace
              </p>
            </div>

            <LogoutButton />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">Name</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {session.user.name}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">Email</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {session.user.email}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">Role</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {session.user.role}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 p-5">
              <p className="text-sm text-zinc-500">Workspace ID</p>
              <p className="mt-1 break-all text-sm font-medium text-zinc-900">
                {session.user.workspaceId}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-zinc-50 p-5">
            <h2 className="text-lg font-semibold text-zinc-900">
              Authentication Status
            </h2>

            <p className="mt-2 text-sm text-green-600">
              ✓ You are authenticated and viewing a protected route.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">
            {session?.user?.name}
          </p>
          <p className="text-xs text-muted">{session?.user?.email}</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-background"
          >
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}

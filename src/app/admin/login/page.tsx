import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "../forms";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="a-center">
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <div className="a-card a-login">
          <h1>Admin not set up</h1>
          <p>Set ADMIN_PASSWORD and ADMIN_SECRET in the server&apos;s environment, then restart.</p>
        </div>
      )}
    </main>
  );
}

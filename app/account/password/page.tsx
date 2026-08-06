import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Set a password" };

export default async function PasswordPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-md px-5 py-24">
      <h1 className="text-center font-serif text-4xl font-light text-ink">
        Set a password
      </h1>
      <p className="mt-3 text-center text-sm text-ink/60">
        Choose a password you will use to sign in from now on.
      </p>
      <PasswordForm />
    </div>
  );
}

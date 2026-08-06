import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-24">
      <div className="mx-auto max-w-md">
        <h1 className="text-center font-serif text-4xl font-light text-[#f3e6cc]">
          Sign in
        </h1>
        <p className="mt-3 text-center text-sm text-[#f3e6cc]/60">
          For order history and saved addresses. You can also check out as a
          guest.
        </p>
        <LoginForm next={typeof next === "string" ? next : "/account"} />
      </div>
    </div>
  );
}

"use client";

export function ConfirmForm({
  message,
  action,
  children,
}: {
  message: string;
  action: (fd: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}

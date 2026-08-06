import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-[#0b0906] px-5 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-4xl font-light text-[#f3e6cc]">
          Checkout
        </h1>
        <CheckoutForm />
      </div>
    </div>
  );
}

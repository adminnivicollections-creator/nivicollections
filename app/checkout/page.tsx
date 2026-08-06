import { CheckoutForm } from "./CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <h1 className="font-serif text-4xl font-light text-ink">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}

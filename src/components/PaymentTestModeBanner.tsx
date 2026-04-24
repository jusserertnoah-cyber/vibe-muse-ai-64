import { isTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isTestMode()) return null;
  return (
    <div className="w-full bg-orange-100 border-b border-orange-300 px-4 py-2 text-center text-xs text-orange-800">
      Mode test — utilise <span className="font-mono font-semibold">4242 4242 4242 4242</span> pour tester un paiement.
    </div>
  );
}
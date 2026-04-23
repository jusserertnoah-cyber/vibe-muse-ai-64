import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Step = "phone" | "otp";

const normalizePhone = (raw: string): string | null => {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return null;
  if (cleaned.length < 8 || cleaned.length > 16) return null;
  return cleaned;
};

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Si déjà connecté, on file droit dans l'app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const sendCode = async () => {
    const e164 = normalizePhone(phone);
    if (!e164) {
      toast.error("Numéro invalide", {
        description: "Format international avec indicatif. Ex : +33612345678",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { channel: "sms" },
    });
    setLoading(false);
    if (error) {
      toast.error("Envoi impossible", { description: error.message });
      return;
    }
    toast.success("Code envoyé", { description: `Vérifie tes SMS sur ${e164}` });
    setPhone(e164);
    setStep("otp");
  };

  const verifyCode = async () => {
    if (otp.length < 4) {
      toast.error("Entre le code reçu par SMS");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error("Code incorrect", { description: error.message });
      return;
    }
    toast.success("Bienvenue ✨");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <VibeLogo className="text-xl" />
          {step === "otp" && (
            <button
              onClick={() => setStep("phone")}
              className="flex items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Retour
            </button>
          )}
        </header>

        <div className="mt-16 flex-1 animate-fade-up">
          {step === "phone" ? (
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Phone className="h-6 w-6 text-accent" strokeWidth={1.5} />
              </div>
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Entre ton numéro de téléphone
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu recevras un code par SMS pour te connecter ou créer ton compte.
              </p>
              <Input
                autoFocus
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="h-14 rounded-2xl border-border bg-card text-lg"
              />
              <Button
                onClick={sendCode}
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-accent text-accent-foreground hover:opacity-90 text-base"
              >
                {loading ? "Envoi…" : "Recevoir le code"}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                En continuant, tu acceptes les CGU et la politique de confidentialité.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <ShieldCheck className="h-6 w-6 text-accent" strokeWidth={1.5} />
              </div>
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Entre le code reçu
              </h1>
              <p className="text-sm text-muted-foreground">
                Code envoyé au <span className="font-medium text-foreground">{phone}</span>.
              </p>
              <Input
                autoFocus
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="h-14 rounded-2xl border-border bg-card text-center font-mono-tech text-2xl tracking-[0.5em]"
              />
              <Button
                onClick={verifyCode}
                disabled={loading}
                className="h-14 w-full rounded-2xl bg-accent text-accent-foreground hover:opacity-90 text-base"
              >
                {loading ? "Vérification…" : "Vérifier le code"}
              </Button>
              <button
                onClick={sendCode}
                disabled={loading}
                className="w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Renvoyer le code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
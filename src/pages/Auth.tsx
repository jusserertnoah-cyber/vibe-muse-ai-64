import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, findCountryByCode } from "@/lib/countries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn } from "@/lib/utils";

type Step = "phone" | "otp";

const normalizePhone = (local: string, countryCode: string): string | null => {
  const country = findCountryByCode(countryCode);
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;
  const candidate = `+${country.dial}${digits}`;
  const parsed = parsePhoneNumberFromString(candidate, country.code as any);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // E.164
};

export default function Auth() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState<string>("FR");
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Si déjà connecté, on file droit dans l'app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  const sendCode = async () => {
    const normalized = normalizePhone(phone, countryCode);
    if (!normalized) {
      toast.error("Numéro invalide", {
        description: "Vérifie le pays et le numéro saisi.",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { channel: "sms" },
    });
    setLoading(false);
    if (error) {
      toast.error("Envoi impossible", { description: error.message });
      return;
    }
    toast.success("Code envoyé", { description: `Vérifie tes SMS sur ${normalized}` });
    setE164(normalized);
    setStep("otp");
  };

  const verifyCode = async () => {
    if (otp.length < 4) {
      toast.error("Entre le code reçu par SMS");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
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
              <div className="flex gap-2">
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-14 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-base"
                    >
                      <span className="text-xl leading-none">{findCountryByCode(countryCode).flag}</span>
                      <span className="font-mono text-sm text-muted-foreground">
                        +{findCountryByCode(countryCode).dial}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un pays…" />
                      <CommandList>
                        <CommandEmpty>Aucun pays.</CommandEmpty>
                        <CommandGroup>
                          {COUNTRIES.map((c) => (
                            <CommandItem
                              key={c.code}
                              value={`${c.name} +${c.dial} ${c.code}`}
                              onSelect={() => {
                                setCountryCode(c.code);
                                setCountryOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-base">{c.flag}</span>
                              <span className="flex-1 truncate">{c.name}</span>
                              <span className="font-mono text-xs text-muted-foreground">+{c.dial}</span>
                              <Check
                                className={cn(
                                  "h-4 w-4 text-accent",
                                  countryCode === c.code ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  autoFocus
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="6 12 34 56 78"
                  className="h-14 flex-1 rounded-2xl border-border bg-card text-lg"
                />
              </div>
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
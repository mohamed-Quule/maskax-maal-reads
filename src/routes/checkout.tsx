import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { useFormValidation } from "@/hooks/use-form-validation";
import { checkoutSchema } from "@/lib/schemas";
import { placeOrder as placeOrderFn } from "@/lib/validated-writes.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Smartphone } from "lucide-react";


export const Route = createFileRoute("/checkout")({ component: Checkout });

const METHODS = [
  { id: "evc_plus", label: "EVC Plus", color: "#0aa06e" },
  { id: "zaad", label: "Zaad", color: "#e11d48" },
  { id: "sahal", label: "Sahal", color: "#f59e0b" },
] as const;

function Checkout() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [method, setMethod] = useState<typeof METHODS[number]["id"]>("evc_plus");
  const [phone, setPhone] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("cart_items")
        .select("*, books(id,title,price,stock)")
        .eq("user_id", user.id);
      return data ?? [];
    },
    enabled: !!user,
  });

  const subtotal = items.reduce((s, i: any) => s + Number(i.books?.price ?? 0) * i.quantity, 0);

  const v = useFormValidation(
    useMemo(() => checkoutSchema(lang), [lang]),
    useMemo(() => ({ phone, method }), [phone, method]),
  );
  const submitOrder = useServerFn(placeOrderFn);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error(lang === "en" ? "Your cart is empty." : "Gaarigaagu waa madhan yahay.");
      const parsed = v.validateAll();
      if (!parsed) throw new Error(lang === "en" ? "Please fix the highlighted fields." : "Fadlan hagaaji goobaha calaamadaysan.");
      const res = await submitOrder({ data: { lang, phone: parsed.phone, method: parsed.method } });
      return res.orderId;
    },

    onSuccess: (orderId) => {
      qc.invalidateQueries();
      toast.success(lang === "en" ? "Order placed! Awaiting payment confirmation." : "Dalabku wuu dhacay!");
      nav({ to: "/account/orders/$id", params: { id: orderId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) {
    nav({ to: "/auth" });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-4xl md:text-5xl">{lang === "en" ? "Checkout" : "Biilka"}</h1>
        <p className="mt-2 text-muted-foreground">
          {lang === "en"
            ? "Pay using Somali mobile money — confirmation is manual and quick."
            : "Bixi lacagta adigoo isticmaalaya EVC / Zaad / Sahal."}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <h3 className="font-display text-2xl">{lang === "en" ? "Payment method" : "Habka lacag bixinta"}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition ${
                    method === m.id ? "border-emerald bg-emerald/5" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="grid size-9 place-items-center rounded-md text-white" style={{ background: m.color }}>
                    <Smartphone className="size-4" />
                  </div>
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.id === "evc_plus" ? "Hormuud" : m.id === "zaad" ? "Telesom" : "Golis"}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-lg border bg-paper p-6">
              <label className="mb-2 block text-sm font-semibold">
                {lang === "en" ? "Mobile money phone number" : "Lambarka moobiylka"}
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+252 61 000 0000"
                inputMode="tel"
              />
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald" />
                {lang === "en"
                  ? "You'll receive a push notification from your mobile money app to approve the payment."
                  : "Waxaad heli doontaa fariin lagaga codsanayo inaad ansixiso lacagta."}
              </p>
            </div>
          </div>

          <div className="h-fit rounded-lg border bg-paper p-6">
            <h3 className="font-display text-xl">{lang === "en" ? "Your order" : "Dalabkaaga"}</h3>
            <div className="mt-4 space-y-2 text-sm">
              {items.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-foreground/80">{i.books.title} × {i.quantity}</span>
                  <span className="font-medium">{money(Number(i.books.price) * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <span className="font-semibold">{lang === "en" ? "Total" : "Wadarta"}</span>
              <span className="font-display text-2xl font-semibold text-brand">{money(subtotal)}</span>
            </div>
            <Button
              className="mt-6 w-full bg-emerald text-emerald-foreground hover:bg-emerald/90"
              onClick={() => placeOrder.mutate()}
              disabled={placeOrder.isPending || items.length === 0}
            >
              {placeOrder.isPending
                ? lang === "en" ? "Placing…" : "Diraya…"
                : lang === "en" ? "Confirm & pay" : "Xaqiiji & bixi"}
            </Button>
            <Link to="/cart" className="mt-3 block text-center text-xs text-muted-foreground hover:text-emerald">
              ← {lang === "en" ? "Back to cart" : "Ku noqo gaariga"}
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

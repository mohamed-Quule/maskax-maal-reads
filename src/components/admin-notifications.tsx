import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, ShoppingBag, CreditCard } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function timeAgo(iso: string, lang: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return lang === "en" ? "just now" : "hadda";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function AdminNotifications() {
  const { lang } = useI18n();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });

  const unread = items.filter((n) => !n.is_read).length;

  const markAll = useMutation({
    mutationFn: async () => {
      const ids = items.filter((n) => !n.is_read).map((n) => n.id);
      if (!ids.length) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new as { title: string; message: string };
          toast.success(n.title, { description: n.message, duration: 8000 });
          qc.invalidateQueries({ queryKey: ["admin-notifications"] });
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/80 hover:bg-white/10 hover:text-white"
          aria-label={lang === "en" ? "Notifications" : "Ogeysiisyada"}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-emerald px-1 text-[10px] font-bold text-emerald-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">
            {lang === "en" ? "Notifications" : "Ogeysiisyada"}
          </span>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald"
            >
              <CheckCheck className="size-3" />
              {lang === "en" ? "Mark all read" : "Dhammaan akhri"}
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && (
            <p className="p-6 text-center text-xs text-muted-foreground">
              {lang === "en" ? "No notifications yet." : "Weli ogeysiis ma jiro."}
            </p>
          )}
          {items.map((n) => (
            <Link
              key={n.id}
              to="/admin/orders"
              className={`flex gap-3 border-b px-3 py-3 text-left transition hover:bg-muted/60 ${
                n.is_read ? "" : "bg-emerald/5"
              }`}
            >
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-emerald/15 text-emerald">
                {n.type === "order_payment" ? (
                  <CreditCard className="size-3.5" />
                ) : (
                  <ShoppingBag className="size-3.5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{n.title}</div>
                <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {timeAgo(n.created_at, lang)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

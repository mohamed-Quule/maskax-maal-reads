CREATE TABLE public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'order',
  title text not null,
  message text not null,
  link text,
  order_id uuid references public.orders(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notifications" ON public.notifications
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update notifications" ON public.notifications
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX notifications_created_idx ON public.notifications (created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_admin_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buyer text;
BEGIN
  SELECT coalesce(p.full_name, 'A customer') INTO buyer FROM public.profiles p WHERE p.id = NEW.user_id;
  INSERT INTO public.notifications (type, title, message, link, order_id)
  VALUES (
    'order_new',
    'New order ' || NEW.order_number,
    coalesce(buyer, 'A customer') || ' placed an order of $' || to_char(NEW.total, 'FM999999990.00') ||
      ' via ' || coalesce(NEW.payment_method::text, 'unknown'),
    '/admin/orders',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_order();

CREATE OR REPLACE FUNCTION public.notify_admin_order_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
    INSERT INTO public.notifications (type, title, message, link, order_id)
    VALUES (
      'order_payment',
      'Order ' || NEW.order_number || ' is ' || NEW.payment_status::text,
      'Payment status changed from ' || OLD.payment_status::text || ' to ' || NEW.payment_status::text || '.',
      '/admin/orders',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_order_payment
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_admin_order_payment();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
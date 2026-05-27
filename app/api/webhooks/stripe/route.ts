import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Reverse map: Stripe price ID → plan name
function planFromPriceId(priceId: string): string | undefined {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASE!]:  "base",
    [process.env.STRIPE_PRICE_PRO!]:   "pro",
    [process.env.STRIPE_PRICE_ELITE!]: "elite",
  };
  return map[priceId];
}

// In Stripe SDK v22, current_period_end moved to the subscription item level
function periodEnd(sub: Stripe.Subscription): string {
  const item = sub.items.data[0] as Stripe.SubscriptionItem;
  return new Date(item.current_period_end * 1000).toISOString();
}

// In Stripe SDK v22, invoice.subscription moved to invoice.parent.subscription_details.subscription
function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = (invoice as any).parent;
  const subRef = parent?.subscription_details?.subscription;
  if (!subRef) return null;
  return typeof subRef === "string" ? subRef : subRef.id;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createServiceClient();

  try {
    switch (event.type) {

      // ── New subscription created via checkout ─────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId  = session.metadata?.userId;
        const plan    = session.metadata?.plan;

        if (!userId || !plan || !session.subscription) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);

        await db.from("memberships").upsert(
          {
            user_id:                userId,
            plan,
            status:                 "active",
            stripe_customer_id:     session.customer as string,
            stripe_subscription_id: sub.id,
            stripe_price_id:        sub.items.data[0].price.id,
            current_period_end:     periodEnd(sub),
            updated_at:             new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }

      // ── Plan change, renewal, or status change ────────────────────────────
      case "customer.subscription.updated": {
        const sub     = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0].price.id;
        const plan    = planFromPriceId(priceId);

        const status =
          sub.status === "active"   ? "active"   :
          sub.status === "past_due" ? "past_due" : "cancelled";

        await db.from("memberships")
          .update({
            ...(plan && { plan }),
            status,
            stripe_price_id:    priceId,
            current_period_end: periodEnd(sub),
            updated_at:         new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await db.from("memberships")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // ── Payment failed — mark past_due ────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId   = subscriptionIdFromInvoice(invoice);

        if (subId) {
          await db.from("memberships")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

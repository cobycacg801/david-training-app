import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string> = {
  base:  process.env.STRIPE_PRICE_BASE!,
  pro:   process.env.STRIPE_PRICE_PRO!,
  elite: process.env.STRIPE_PRICE_ELITE!,
};

export async function POST(req: Request) {
  try {
    const { plan, userId, email } = await req.json();

    const priceId = PRICE_MAP[plan];
    if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&user_id=${userId}&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?plan=${plan}&cancelled=true`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

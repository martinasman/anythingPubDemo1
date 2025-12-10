import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { addCredits } from '@/lib/credits';

// Lazy initialization to avoid build-time errors when env vars aren't set
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Use the credits-specific webhook secret, or fall back to main webhook secret
    const webhookSecret =
      process.env.STRIPE_CREDITS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET!;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[Stripe Credits Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulCreditPurchase(session);
      break;
    }
    default:
      console.log(`[Stripe Credits Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulCreditPurchase(session: Stripe.Checkout.Session) {
  // Only process credit purchases (not lead payments)
  if (session.metadata?.type !== 'credit_purchase') {
    console.log('[Stripe Credits Webhook] Ignoring non-credit purchase event');
    return;
  }

  const userId = session.metadata.userId;
  const credits = parseInt(session.metadata.credits || '0', 10);
  const packageId = session.metadata.packageId;

  if (!userId || !credits) {
    console.error('[Stripe Credits Webhook] Missing metadata:', session.metadata);
    return;
  }

  console.log('[Stripe Credits Webhook] Processing credit purchase:', {
    userId,
    credits,
    packageId,
    sessionId: session.id,
  });

  // Add credits to user account
  const result = await addCredits(
    userId,
    credits,
    'purchase',
    `Purchased ${packageId} package (${credits} credits)`,
    {
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent as string,
      creditPackage: packageId,
    }
  );

  if (!result.success) {
    console.error('[Stripe Credits Webhook] Failed to add credits:', result.error);
    // Don't return error - Stripe will retry. Log for investigation.
  } else {
    console.log(
      `[Stripe Credits Webhook] Credits added successfully. User: ${userId}, New balance: ${result.credits}`
    );
  }
}

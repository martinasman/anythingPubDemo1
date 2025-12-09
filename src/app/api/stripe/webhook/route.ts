import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSuccessfulPayment(session);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('[Stripe Webhook] Payment succeeded:', paymentIntent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleFailedPayment(paymentIntent);
      break;
    }
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const leadId = session.metadata?.leadId;
  const amountTotal = session.amount_total;

  if (!leadId) {
    console.error('[Stripe Webhook] No leadId in session metadata');
    return;
  }

  console.log('[Stripe Webhook] Payment successful for lead:', leadId);

  // Update lead with payment status
  const { error } = await supabase
    .from('leads')
    .update({
      stripe_payment_status: 'paid',
      stripe_customer_id: session.customer as string || null,
      paid_at: new Date().toISOString(),
      paid_amount: amountTotal ? amountTotal / 100 : null, // Convert from cents
      status: 'closed', // Auto-close the lead on payment
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    console.error('[Stripe Webhook] Error updating lead:', error);
    return;
  }

  // Log activity
  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    type: 'status_changed',
    content: `Payment received: $${amountTotal ? (amountTotal / 100).toFixed(2) : '0'}`,
    metadata: {
      previousStatus: 'new',
      newStatus: 'closed',
      paymentAmount: amountTotal ? amountTotal / 100 : 0,
      stripeSessionId: session.id,
    },
    created_at: new Date().toISOString(),
  });

  console.log('[Stripe Webhook] Lead updated successfully:', leadId);
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const leadId = paymentIntent.metadata?.leadId;

  if (!leadId) {
    console.error('[Stripe Webhook] No leadId in payment intent metadata');
    return;
  }

  console.log('[Stripe Webhook] Payment failed for lead:', leadId);

  // Update lead with failed status
  const { error } = await supabase
    .from('leads')
    .update({
      stripe_payment_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (error) {
    console.error('[Stripe Webhook] Error updating lead:', error);
  }
}

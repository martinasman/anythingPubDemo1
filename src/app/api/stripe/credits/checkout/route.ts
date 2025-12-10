import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';
import { getCreditPackage } from '@/data/pricing';

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
  try {
    const stripe = getStripe();
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId } = await request.json();

    // Validate package
    const creditPackage = getCreditPackage(packageId);
    if (!creditPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditPackage.name} Credit Package`,
              description: `${creditPackage.credits} credits for Anything`,
            },
            unit_amount: creditPackage.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
        packageId: creditPackage.id,
        credits: creditPackage.credits.toString(),
        type: 'credit_purchase', // Important: distinguishes from lead payments
      },
      customer_email: user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?credits=success&package=${creditPackage.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Credits Checkout] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

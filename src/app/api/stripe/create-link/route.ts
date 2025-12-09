import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, projectId, amount, currency = 'usd', description, leadName, leadEmail } = body;

    if (!leadId || !projectId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, projectId, amount' },
        { status: 400 }
      );
    }

    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create a Stripe product for this one-time payment
    const product = await stripe.products.create({
      name: description || `Website for ${leadName}`,
      metadata: {
        leadId,
        projectId,
      },
    });

    // Create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountInCents,
      currency: currency.toLowerCase(),
    });

    // Create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      metadata: {
        leadId,
        projectId,
        leadName: leadName || '',
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-success?lead_id=${leadId}`,
        },
      },
      // Collect customer email if not provided
      ...(leadEmail ? {} : {
        custom_fields: [
          {
            key: 'customer_email',
            label: { type: 'custom', custom: 'Email' },
            type: 'text',
          },
        ],
      }),
    });

    // Update the lead with stripe payment link info
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        stripe_payment_status: 'pending',
        deal_value: amount,
        deal_currency: currency.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('[Stripe] Error updating lead:', updateError);
      // Don't fail - the payment link was created successfully
    }

    return NextResponse.json({
      success: true,
      paymentLink: {
        id: paymentLink.id,
        url: paymentLink.url,
        amount,
        currency: currency.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('[Stripe] Error creating payment link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment link' },
      { status: 500 }
    );
  }
}

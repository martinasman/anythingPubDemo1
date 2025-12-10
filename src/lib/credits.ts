import { createAdminClient } from '@/utils/supabase/admin';

// ============================================
// CREDIT SYSTEM UTILITIES
// ============================================
// Core functions for managing user credits

export interface CreditResult {
  success: boolean;
  credits?: number;
  error?: string;
}

// Default credits for new users
const FREE_TIER_CREDITS = 50;

/**
 * Get user's current credit balance
 * Auto-creates profile with free tier credits if missing
 */
export async function getCredits(userId: string): Promise<CreditResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('credits')
    .eq('user_id', userId)
    .single();

  if (error) {
    // Profile doesn't exist yet - create it with free tier credits
    if (error.code === 'PGRST116') {
      const createResult = await createProfileWithFreeCredits(userId);
      return createResult;
    }
    console.error('[Credits] Failed to get credits:', error);
    return { success: false, error: error.message };
  }

  return { success: true, credits: data.credits };
}

/**
 * Create a new user profile with free tier credits
 */
async function createProfileWithFreeCredits(userId: string): Promise<CreditResult> {
  const supabase = createAdminClient();

  // Create profile
  const { data: newProfile, error: createError } = await supabase
    .from('user_profiles')
    .insert({ user_id: userId, credits: FREE_TIER_CREDITS })
    .select('credits')
    .single();

  if (createError) {
    // Handle race condition - profile may have been created by another request
    if (createError.code === '23505') {
      // Unique violation - fetch the existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, credits: data.credits };
    }
    console.error('[Credits] Failed to create profile:', createError);
    return { success: false, error: createError.message };
  }

  // Record the free tier grant
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: FREE_TIER_CREDITS,
    balance_after: FREE_TIER_CREDITS,
    type: 'free_tier',
    description: 'Welcome credits for new users',
  });

  console.log('[Credits] Created profile with free tier credits for user:', userId);
  return { success: true, credits: newProfile.credits };
}

/**
 * Check if user has enough credits for an operation
 */
export async function hasCredits(userId: string, required: number): Promise<boolean> {
  const result = await getCredits(userId);
  if (!result.success || result.credits === undefined) {
    return false;
  }
  return result.credits >= required;
}

/**
 * Deduct credits for an operation
 * Returns the new balance or an error if insufficient credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: {
    projectId?: string;
    artifactType?: string;
    toolName?: string;
  }
): Promise<CreditResult> {
  const supabase = createAdminClient();

  // Get current balance (creates profile if needed)
  const currentResult = await getCredits(userId);
  if (!currentResult.success || currentResult.credits === undefined) {
    return { success: false, error: currentResult.error || 'Failed to get current balance' };
  }

  if (currentResult.credits < amount) {
    return { success: false, error: 'Insufficient credits' };
  }

  const newBalance = currentResult.credits - amount;

  // Update balance
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ credits: newBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (updateError) {
    console.error('[Credits] Failed to deduct credits:', updateError);
    return { success: false, error: updateError.message };
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount, // Negative for deductions
    balance_after: newBalance,
    type: 'deduction',
    description,
    metadata: metadata
      ? {
          project_id: metadata.projectId,
          artifact_type: metadata.artifactType,
          tool_name: metadata.toolName,
        }
      : null,
  });

  console.log(`[Credits] Deducted ${amount} credits from user ${userId}. New balance: ${newBalance}`);
  return { success: true, credits: newBalance };
}

/**
 * Add credits to user account (for purchases, refunds, bonuses)
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: 'purchase' | 'refund' | 'bonus',
  description: string,
  metadata?: {
    stripeSessionId?: string;
    stripePaymentIntent?: string;
    creditPackage?: string;
  }
): Promise<CreditResult> {
  const supabase = createAdminClient();

  // Get current balance (creates profile if needed)
  const currentResult = await getCredits(userId);
  if (!currentResult.success || currentResult.credits === undefined) {
    return { success: false, error: currentResult.error || 'Failed to get current balance' };
  }

  const newBalance = currentResult.credits + amount;

  // Update balance and lifetime purchased (for purchases)
  const updateData: {
    credits: number;
    updated_at: string;
    lifetime_credits_purchased?: number;
  } = {
    credits: newBalance,
    updated_at: new Date().toISOString(),
  };

  // For purchases, also increment lifetime_credits_purchased
  if (type === 'purchase') {
    // First get current lifetime value
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('lifetime_credits_purchased')
      .eq('user_id', userId)
      .single();

    if (profile) {
      updateData.lifetime_credits_purchased = (profile.lifetime_credits_purchased || 0) + amount;
    }
  }

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[Credits] Failed to add credits:', updateError);
    return { success: false, error: updateError.message };
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount, // Positive for additions
    balance_after: newBalance,
    type,
    description,
    metadata: metadata
      ? {
          stripe_session_id: metadata.stripeSessionId,
          stripe_payment_intent: metadata.stripePaymentIntent,
          credit_package: metadata.creditPackage,
        }
      : null,
  });

  console.log(`[Credits] Added ${amount} credits to user ${userId}. New balance: ${newBalance}`);
  return { success: true, credits: newBalance };
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(
  userId: string,
  limit = 50
): Promise<{
  success: boolean;
  transactions?: Array<{
    id: string;
    amount: number;
    balanceAfter: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
  error?: string;
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Credits] Failed to get credit history:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    transactions: data.map((t) => ({
      id: t.id,
      amount: t.amount,
      balanceAfter: t.balance_after,
      type: t.type,
      description: t.description,
      createdAt: t.created_at,
    })),
  };
}

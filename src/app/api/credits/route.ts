import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCredits, getCreditHistory } from '@/lib/credits';

// GET - Get user's current credit balance and optionally history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credits
    const result = await getCredits(user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Check if history is requested
    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const historyLimit = parseInt(searchParams.get('limit') || '20', 10);

    let transactions = undefined;
    if (includeHistory) {
      const historyResult = await getCreditHistory(user.id, historyLimit);
      if (historyResult.success) {
        transactions = historyResult.transactions;
      }
    }

    return NextResponse.json({
      credits: result.credits,
      ...(transactions && { transactions }),
    });
  } catch (error) {
    console.error('[Credits API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

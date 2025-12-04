import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { clientRowToClient } from '@/types/database';

// ============================================
// GET - Fetch all clients or a specific client
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const clientId = searchParams.get('clientId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    if (clientId) {
      // Fetch single client
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('project_id', projectId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }

      return NextResponse.json({ client: clientRowToClient(data) });
    } else {
      // Fetch all clients for project
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        clients: (data || []).map(clientRowToClient),
      });
    }
  } catch (error) {
    console.error('[API] GET /clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Create a new client
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      projectId,
      companyName,
      industry,
      primaryContact,
      website,
      status,
      tags,
      notes,
    } = body;

    if (!projectId || !companyName) {
      return NextResponse.json(
        { error: 'projectId and companyName are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          project_id: projectId,
          company_name: companyName,
          industry: industry || null,
          primary_contact_name: primaryContact?.name || null,
          primary_contact_email: primaryContact?.email || null,
          primary_contact_phone: primaryContact?.phone || null,
          primary_contact_title: primaryContact?.title || null,
          website: website || null,
          status: status || 'prospect',
          tags: tags || null,
          notes: notes || null,
          source: 'manual_entry',
          acquisition_date: new Date().toISOString(),
          payment_terms: 30,
          currency: 'USD',
          lifetime_value: 0,
          total_invoiced: 0,
          total_paid: 0,
          outstanding_balance: 0,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to create client' }, { status: 400 });
    }

    return NextResponse.json(
      { client: clientRowToClient(data), success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] POST /clients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

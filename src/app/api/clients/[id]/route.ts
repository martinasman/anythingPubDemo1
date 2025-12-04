import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { clientRowToClient } from '@/types/database';

// ============================================
// GET - Fetch a specific client
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const { id } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client: clientRowToClient(data) });
  } catch (error) {
    console.error('[API] GET /clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update a client
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { projectId, ...updateData } = await request.json();
    const { id } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Build update object from camelCase to snake_case
    const dbUpdateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.companyName) dbUpdateData.company_name = updateData.companyName;
    if (updateData.industry !== undefined) dbUpdateData.industry = updateData.industry;
    if (updateData.website !== undefined) dbUpdateData.website = updateData.website;
    if (updateData.status !== undefined) dbUpdateData.status = updateData.status;
    if (updateData.tags !== undefined) dbUpdateData.tags = updateData.tags;
    if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes;

    if (updateData.primaryContact) {
      if (updateData.primaryContact.name !== undefined)
        dbUpdateData.primary_contact_name = updateData.primaryContact.name;
      if (updateData.primaryContact.email !== undefined)
        dbUpdateData.primary_contact_email = updateData.primaryContact.email;
      if (updateData.primaryContact.phone !== undefined)
        dbUpdateData.primary_contact_phone = updateData.primaryContact.phone;
      if (updateData.primaryContact.title !== undefined)
        dbUpdateData.primary_contact_title = updateData.primaryContact.title;
    }

    if (updateData.financialMetrics) {
      if (updateData.financialMetrics.lifetimeValue !== undefined)
        dbUpdateData.lifetime_value = updateData.financialMetrics.lifetimeValue;
      if (updateData.financialMetrics.totalInvoiced !== undefined)
        dbUpdateData.total_invoiced = updateData.financialMetrics.totalInvoiced;
      if (updateData.financialMetrics.totalPaid !== undefined)
        dbUpdateData.total_paid = updateData.financialMetrics.totalPaid;
      if (updateData.financialMetrics.outstandingBalance !== undefined)
        dbUpdateData.outstanding_balance = updateData.financialMetrics.outstandingBalance;
    }

    const { data, error } = await supabase
      .from('clients')
      .update(dbUpdateData)
      .eq('id', id)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to update client' }, { status: 400 });
    }

    return NextResponse.json({ client: clientRowToClient(data), success: true });
  } catch (error) {
    console.error('[API] PATCH /clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete a client
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const { id } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    console.error('[API] DELETE /clients/[id] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

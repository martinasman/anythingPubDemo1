import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { Client, CRMArtifact, clientRowToClient, clientToClientRow } from '@/types/database';

// ============================================
// CRM TOOL SCHEMA
// ============================================

export const crmSchema = z.object({
  action: z.enum([
    'convert_lead',
    'add_client',
    'update_client',
    'add_client_note',
    'add_client_activity',
    'update_client_status',
  ]),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  clientData: z.object({
    companyName: z.string(),
    industry: z.string().optional(),
    primaryContact: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      title: z.string().optional(),
    }).optional(),
    website: z.string().optional(),
    status: z.enum(['prospect', 'active', 'onboarding', 'paused', 'churned', 'archived']).optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).optional(),
  activityData: z.object({
    type: z.enum([
      'note_added',
      'status_changed',
      'email_sent',
      'call_made',
      'meeting_held',
      'contract_signed',
      'invoice_sent',
      'payment_received',
      'project_started',
      'deliverable_sent',
      'feedback_received',
    ]),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
  newStatus: z.enum(['prospect', 'active', 'onboarding', 'paused', 'churned', 'archived']).optional(),
});

export type CRMParams = z.infer<typeof crmSchema>;

// ============================================
// CRM MANAGEMENT FUNCTION
// ============================================

export async function manageCRM(
  params: CRMParams & { projectId: string }
): Promise<{
  success: boolean;
  message: string;
  clientId?: string;
  summary?: string;
}> {
  const supabase = createAdminClient();
  const { projectId, action } = params;

  try {
    if (action === 'convert_lead') {
      return await convertLeadToClient(supabase, projectId, params);
    } else if (action === 'add_client') {
      return await addClient(supabase, projectId, params);
    } else if (action === 'update_client') {
      return await updateClient(supabase, projectId, params);
    } else if (action === 'add_client_note') {
      return await addClientNote(supabase, projectId, params);
    } else if (action === 'add_client_activity') {
      return await addClientActivity(supabase, projectId, params);
    } else if (action === 'update_client_status') {
      return await updateClientStatus(supabase, projectId, params);
    } else {
      return {
        success: false,
        message: 'Unknown action',
      };
    }
  } catch (error) {
    console.error('[tool-crm] Error:', error);
    return {
      success: false,
      message: `Error executing CRM action: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================
// CRM ACTIONS
// ============================================

async function convertLeadToClient(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; clientId?: string; summary?: string }> {
  const { leadId, clientData } = params;

  if (!leadId) {
    return { success: false, message: 'Lead ID required' };
  }

  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, message: 'Lead not found' };
  }

  // Create client from lead data
  const newClientData = {
    project_id: projectId,
    company_name: lead.company_name,
    industry: lead.industry || null,
    primary_contact_name: lead.contact_name || null,
    primary_contact_email: lead.contact_email || null,
    primary_contact_phone: lead.phone || null,
    primary_contact_title: lead.contact_title || null,
    website: lead.website || null,
    status: 'prospect' as const,
    source: 'lead_conversion',
    lead_id: leadId,
    acquisition_date: new Date().toISOString(),
    notes: lead.notes ? JSON.stringify(lead.notes) : null,
    tags: lead.tags || null,
    payment_terms: 30,
    currency: 'USD',
    lifetime_value: 0,
    total_invoiced: 0,
    total_paid: 0,
    outstanding_balance: 0,
  };

  // Insert client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert([newClientData])
    .select()
    .single();

  if (clientError || !client) {
    return { success: false, message: 'Failed to create client' };
  }

  // Create activity record
  await supabase.from('client_activities').insert([
    {
      project_id: projectId,
      client_id: client.id,
      type: 'status_changed',
      content: `Converted from lead: ${lead.company_name}`,
      user_name: 'system',
      created_at: new Date().toISOString(),
    },
  ]);

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: `Successfully converted ${lead.company_name} to a client`,
    clientId: client.id,
    summary: `Lead "${lead.company_name}" is now a prospect in your CRM`,
  };
}

async function addClient(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; clientId?: string; summary?: string }> {
  const { clientData } = params;

  if (!clientData) {
    return { success: false, message: 'Client data required' };
  }

  const newClientData = {
    project_id: projectId,
    company_name: clientData.companyName,
    industry: clientData.industry || null,
    primary_contact_name: clientData.primaryContact?.name || null,
    primary_contact_email: clientData.primaryContact?.email || null,
    primary_contact_phone: clientData.primaryContact?.phone || null,
    primary_contact_title: clientData.primaryContact?.title || null,
    website: clientData.website || null,
    status: clientData.status || 'prospect',
    source: 'manual_entry',
    acquisition_date: new Date().toISOString(),
    notes: clientData.notes || null,
    tags: clientData.tags || null,
    payment_terms: 30,
    currency: 'USD',
    lifetime_value: 0,
    total_invoiced: 0,
    total_paid: 0,
    outstanding_balance: 0,
  };

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert([newClientData])
    .select()
    .single();

  if (clientError || !client) {
    return { success: false, message: 'Failed to create client' };
  }

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: `Successfully added ${clientData.companyName} as a client`,
    clientId: client.id,
    summary: `${clientData.companyName} is now in your CRM`,
  };
}

async function updateClient(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; summary?: string }> {
  const { clientId, clientData } = params;

  if (!clientId || !clientData) {
    return { success: false, message: 'Client ID and data required' };
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (clientData.companyName) updateData.company_name = clientData.companyName;
  if (clientData.industry) updateData.industry = clientData.industry;
  if (clientData.website) updateData.website = clientData.website;
  if (clientData.primaryContact?.name) updateData.primary_contact_name = clientData.primaryContact.name;
  if (clientData.primaryContact?.email) updateData.primary_contact_email = clientData.primaryContact.email;
  if (clientData.primaryContact?.phone) updateData.primary_contact_phone = clientData.primaryContact.phone;
  if (clientData.primaryContact?.title) updateData.primary_contact_title = clientData.primaryContact.title;
  if (clientData.notes) updateData.notes = clientData.notes;
  if (clientData.tags) updateData.tags = clientData.tags;

  const { error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', clientId);

  if (error) {
    return { success: false, message: 'Failed to update client' };
  }

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: 'Client updated successfully',
    summary: 'Client information has been updated',
  };
}

async function addClientNote(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; summary?: string }> {
  const { clientId, clientData } = params;

  if (!clientId || !clientData?.notes) {
    return { success: false, message: 'Client ID and note required' };
  }

  // Create activity
  await supabase.from('client_activities').insert([
    {
      project_id: projectId,
      client_id: clientId,
      type: 'note_added',
      content: clientData.notes,
      user_name: 'system',
      created_at: new Date().toISOString(),
    },
  ]);

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: 'Note added successfully',
    summary: 'Note has been added to client record',
  };
}

async function addClientActivity(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; summary?: string }> {
  const { clientId, activityData } = params;

  if (!clientId || !activityData) {
    return { success: false, message: 'Client ID and activity data required' };
  }

  const { data: activity, error } = await supabase
    .from('client_activities')
    .insert([
      {
        project_id: projectId,
        client_id: clientId,
        type: activityData.type,
        content: activityData.content || null,
        metadata: activityData.metadata || null,
        user_name: 'system',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: 'Failed to add activity' };
  }

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: 'Activity recorded successfully',
    summary: `Activity "${activityData.type}" recorded`,
  };
}

async function updateClientStatus(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  params: CRMParams & { projectId: string }
): Promise<{ success: boolean; message: string; summary?: string }> {
  const { clientId, newStatus } = params;

  if (!clientId || !newStatus) {
    return { success: false, message: 'Client ID and new status required' };
  }

  // Update client status
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId);

  if (updateError) {
    return { success: false, message: 'Failed to update client status' };
  }

  // Record activity
  await supabase.from('client_activities').insert([
    {
      project_id: projectId,
      client_id: clientId,
      type: 'status_changed',
      content: `Status changed to ${newStatus}`,
      user_name: 'system',
      created_at: new Date().toISOString(),
    },
  ]);

  // Rebuild CRM artifact
  await rebuildCRMArtifact(supabase, projectId);

  return {
    success: true,
    message: `Client status updated to ${newStatus}`,
    summary: `Client status is now ${newStatus}`,
  };
}

// ============================================
// ARTIFACT BUILDING
// ============================================

async function rebuildCRMArtifact(
  supabase: ReturnType<typeof createAdminClient>,
  projectId: string
): Promise<void> {
  try {
    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (clientsError || !clients) {
      console.error('[tool-crm] Failed to fetch clients:', clientsError);
      return;
    }

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('client_activities')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate metrics
    const activeClients = clients.filter(c => c.status === 'active' || c.status === 'onboarding').length;
    const totalLifetimeValue = clients.reduce((sum, c) => sum + (c.lifetime_value || 0), 0);

    // Build CRM artifact
    const crmArtifact: CRMArtifact = {
      clients: clients.map(c => ({
        id: c.id,
        companyName: c.company_name,
        industry: c.industry || undefined,
        status: c.status,
        primaryContact: {
          name: c.primary_contact_name || undefined,
          email: c.primary_contact_email || undefined,
          phone: c.primary_contact_phone || undefined,
          title: c.primary_contact_title || undefined,
        },
        financialMetrics: {
          lifetimeValue: c.lifetime_value || 0,
          totalInvoiced: c.total_invoiced || 0,
          totalPaid: c.total_paid || 0,
          outstandingBalance: c.outstanding_balance || 0,
        },
        activeProjects: 0, // Will be populated when we add project data
        lastActivityDate: activities?.find(a => a.client_id === c.id)?.created_at,
        tags: c.tags || [],
      })),
      metrics: {
        totalClients: clients.length,
        activeClients,
        pipelineValue: totalLifetimeValue,
      },
      recentActivities: (activities || []).map(a => ({
        id: a.id,
        projectId: a.project_id,
        clientId: a.client_id,
        type: a.type,
        content: a.content || undefined,
        metadata: a.metadata || undefined,
        relatedContractId: a.related_contract_id || undefined,
        relatedInvoiceId: a.related_invoice_id || undefined,
        relatedProjectId: a.related_project_id || undefined,
        userName: a.user_name || undefined,
        createdAt: a.created_at,
      })),
    };

    // UPSERT artifact
    const { error: upsertError } = await supabase
      .from('artifacts')
      .upsert({
        project_id: projectId,
        type: 'crm',
        data: crmArtifact,
        version: 1,
      }, { onConflict: 'project_id,type' });

    if (upsertError) {
      console.error('[tool-crm] Failed to upsert CRM artifact:', upsertError);
    }
  } catch (error) {
    console.error('[tool-crm] Error rebuilding CRM artifact:', error);
  }
}

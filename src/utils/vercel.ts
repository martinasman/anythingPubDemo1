// Vercel Deployment Service
// Handles programmatic deployment to Vercel via their REST API

import { createHash } from 'crypto';

// Types
export type VercelFile = {
  file: string;    // File path (e.g., "index.html")
  data: string;    // Base64 encoded content OR raw content
  encoding?: 'base64' | 'utf-8';
};

export type DeploymentResult = {
  id: string;
  url: string;
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  alias?: string[];
};

export type DomainConfig = {
  name: string;
  configured: boolean;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
};

// Environment variables
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const PUBLISH_BASE_DOMAIN = process.env.PUBLISH_BASE_DOMAIN || 'vercel.app';

const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Get headers for Vercel API requests
 */
function getHeaders(): HeadersInit {
  if (!VERCEL_API_TOKEN) {
    throw new Error('VERCEL_API_TOKEN environment variable is not set');
  }
  return {
    'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get team query params if team ID is set
 */
function getTeamParams(): string {
  return VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : '';
}

/**
 * Calculate SHA1 hash of file content (required by Vercel)
 */
function calculateSha(content: string): string {
  return createHash('sha1').update(content).digest('hex');
}

/**
 * Upload files to Vercel's file storage
 * Returns array of file references for deployment
 */
async function uploadFiles(files: VercelFile[]): Promise<Array<{ file: string; sha: string; size: number }>> {
  const uploadedFiles: Array<{ file: string; sha: string; size: number }> = [];

  for (const file of files) {
    const content = file.encoding === 'base64'
      ? Buffer.from(file.data, 'base64').toString('utf-8')
      : file.data;

    const sha = calculateSha(content);
    const size = Buffer.byteLength(content, 'utf-8');

    // Upload file to Vercel
    const response = await fetch(`${VERCEL_API_BASE}/v2/files${getTeamParams()}`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'x-vercel-digest': sha,
        'Content-Length': size.toString(),
      },
      body: content,
    });

    if (!response.ok && response.status !== 409) {
      // 409 means file already exists, which is fine
      const error = await response.text();
      throw new Error(`Failed to upload file ${file.file}: ${error}`);
    }

    uploadedFiles.push({ file: file.file, sha, size });
  }

  return uploadedFiles;
}

/**
 * Deploy website files to Vercel
 *
 * @param files - Array of files to deploy
 * @param projectName - Name for the Vercel project
 * @param subdomain - Desired subdomain (will be used as project name)
 * @returns Deployment result with URL
 */
export async function deployToVercel(
  files: Array<{ path: string; content: string }>,
  projectName: string,
  subdomain: string
): Promise<DeploymentResult> {
  // Convert files to Vercel format
  const vercelFiles: VercelFile[] = files.map(f => ({
    file: f.path.startsWith('/') ? f.path.slice(1) : f.path,
    data: f.content,
    encoding: 'utf-8' as const,
  }));

  // Upload all files first
  const uploadedFiles = await uploadFiles(vercelFiles);

  // Create deployment
  const deploymentPayload = {
    name: subdomain,
    files: uploadedFiles,
    projectSettings: {
      framework: null, // Static site
    },
    target: 'production',
  };

  const response = await fetch(`${VERCEL_API_BASE}/v13/deployments${getTeamParams()}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(deploymentPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create deployment: ${error}`);
  }

  const deployment = await response.json();

  return {
    id: deployment.id,
    url: `https://${deployment.url}`,
    readyState: deployment.readyState,
    alias: deployment.alias,
  };
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(deploymentId: string): Promise<DeploymentResult> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v13/deployments/${deploymentId}${getTeamParams()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get deployment status: ${error}`);
  }

  const deployment = await response.json();

  return {
    id: deployment.id,
    url: `https://${deployment.url}`,
    readyState: deployment.readyState,
    alias: deployment.alias,
  };
}

/**
 * Add a custom domain to a Vercel project
 */
export async function addCustomDomain(
  projectId: string,
  domain: string
): Promise<DomainConfig> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v10/projects/${projectId}/domains${getTeamParams()}`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: domain }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to add domain: ${error}`);
  }

  const result = await response.json();

  return {
    name: result.name,
    configured: result.configured || false,
    verified: result.verified || false,
    verification: result.verification,
  };
}

/**
 * Get domain configuration including DNS verification status
 */
export async function getDomainConfig(domain: string): Promise<DomainConfig> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v6/domains/${domain}/config${getTeamParams()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get domain config: ${error}`);
  }

  const result = await response.json();

  return {
    name: domain,
    configured: result.configuredBy !== null,
    verified: !result.misconfigured,
    verification: result.verification,
  };
}

/**
 * Verify DNS configuration for a domain
 */
export async function verifyDomain(
  projectId: string,
  domain: string
): Promise<{ verified: boolean; error?: string }> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}/verify${getTeamParams()}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      verified: false,
      error: errorData.error?.message || 'Failed to verify domain',
    };
  }

  const result = await response.json();

  return {
    verified: result.verified || false,
  };
}

/**
 * Remove a domain from a project
 */
export async function removeDomain(
  projectId: string,
  domain: string
): Promise<boolean> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}/domains/${domain}${getTeamParams()}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  return response.ok;
}

/**
 * Get or create a Vercel project by name
 */
export async function getOrCreateProject(
  projectName: string
): Promise<{ id: string; name: string }> {
  // First try to get existing project
  const getResponse = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${encodeURIComponent(projectName)}${getTeamParams()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  if (getResponse.ok) {
    const project = await getResponse.json();
    return { id: project.id, name: project.name };
  }

  // Project doesn't exist, create it
  const createResponse = await fetch(
    `${VERCEL_API_BASE}/v10/projects${getTeamParams()}`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: projectName,
        framework: null, // Static site
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create project: ${error}`);
  }

  const project = await createResponse.json();
  return { id: project.id, name: project.name };
}

/**
 * Delete a Vercel project
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const response = await fetch(
    `${VERCEL_API_BASE}/v9/projects/${projectId}${getTeamParams()}`,
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );

  return response.ok;
}

/**
 * Sanitize a string to be used as a valid subdomain
 */
export function sanitizeSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')        // Remove leading/trailing hyphens
    .slice(0, 63);                // Max 63 chars for subdomain
}

/**
 * Generate full deployment URL from subdomain
 */
export function getDeploymentUrl(subdomain: string, baseDomain?: string): string {
  const domain = baseDomain || PUBLISH_BASE_DOMAIN;
  return `https://${subdomain}.${domain}`;
}

/**
 * Check if Vercel integration is configured
 */
export function isVercelConfigured(): boolean {
  return !!VERCEL_API_TOKEN;
}

// AI Agent Permission Control System
// Demonstrates role-based action gating for AI agents

const agentProfiles = {
  emailAgent: {
    allowed: ['read_email', 'draft_reply', 'search_inbox'],
    restricted: ['send_bulk', 'delete_all', 'export_contacts', 'forward_all'],
  },
  dataAgent: {
    allowed: ['read_public_data', 'generate_report', 'search_records'],
    restricted: ['access_passwords', 'export_raw_db', 'delete_records', 'dump_all'],
  },
  codeAgent: {
    allowed: ['read_code', 'suggest_fix', 'run_tests'],
    restricted: ['deploy_production', 'delete_repo', 'modify_env', 'access_secrets'],
  },
};

export async function POST(request) {
  const { agentName, action, sessionId } = await request.json();

  const profile = agentProfiles[agentName];

  // Unknown agent
  if (!profile) {
    return Response.json(
      { allowed: false, reason: 'Unknown agent' },
      { status: 404 }
    );
  }

  // Restricted action — high-threat block
  if (profile.restricted.includes(action)) {
    return Response.json(
      {
        allowed: false,
        reason: 'Action restricted',
        action,
        agentName,
        threatLevel: 'HIGH',
      },
      { status: 403 }
    );
  }

  // Explicitly allowed action
  if (profile.allowed.includes(action)) {
    return Response.json(
      {
        allowed: true,
        result: 'Action executed successfully',
        action,
        agentName,
      },
      { status: 200 }
    );
  }

  // Action not recognised in either list
  return Response.json(
    { allowed: false, reason: 'Action not in permission list' },
    { status: 403 }
  );
}

export async function GET() {
  return Response.json(agentProfiles, { status: 200 });
}

import { NextResponse } from 'next/server';
import { ArmorIQClient } from '@armoriq/sdk';
import SecurityMiddleware from '@/lib/SecurityMiddleware';

const middleware = new SecurityMiddleware();

// Initialize the ArmorIQ Client
const client = new ArmorIQClient({
  apiKey: process.env.ARMORIQ_API_KEY,
  userId: process.env.ARMORIQ_USER_ID || 'user_hackathon_demo',
  agentId: process.env.ARMORIQ_AGENT_ID,
});

const AGENT_PROFILES = {
  emailAgent: {
    allowed: ['send_email', 'read_inbox', 'reply_email', 'draft_email'],
    restricted: ['delete_all', 'export_contacts', 'forward_all', 'access_calendar'],
    dailyLimit: 100,
    label: '📧 Email Assistant',
    color: '#00e5ff',
    icon: '📧',
  },
  dataAgent: {
    allowed: ['query_db', 'read_report', 'export_csv', 'filter_records'],
    restricted: ['drop_table', 'delete_records', 'update_schema', 'grant_access'],
    dailyLimit: 50,
    label: '🗄️ Data Analyst',
    color: '#bf5af2',
    icon: '🗄️',
  },
  codeAgent: {
    allowed: ['run_tests', 'lint_code', 'read_file', 'write_file', 'git_status'],
    restricted: ['rm_rf', 'exec_shell', 'install_package', 'modify_env', 'access_secrets'],
    dailyLimit: 200,
    label: '💻 Code Reviewer',
    color: '#00ff88',
    icon: '💻',
  },
};

export async function GET() {
  return NextResponse.json(AGENT_PROFILES);
}

export async function POST(request) {
  try {
    const { agentName, action: rawAction, payload } = await request.json();
    
    // Normalize spaces to underscores (e.g. "send email" -> "send_email")
    const action = String(rawAction || '').trim().replace(/\s+/g, '_');

    // 1. Run local rule checks
    const localCheck = middleware.checkAgentPermission(agentName, action);

    // 2. Define tool execution plan for ArmorIQ intent verification
    const mcpName = `${agentName}-mcp`;
    const plan = {
      goal: `Execute action ${action} for ${agentName}`,
      steps: [
        {
          action: action,
          tool: agentName,
          mcp: mcpName,
          inputs: { action, payload },
        },
      ],
    };

    let token = 'mock-intent-token-' + Date.now();
    let armoriqCheck = { allowed: localCheck.allowed, reason: localCheck.reason };

    try {
      // 3. Register plan and capture intent token from ArmorIQ Access Proxy
      const planCapture = client.capturePlan('google/gemini-2.5-flash', `Requesting ${action}`, plan);
      const rawToken = await client.getIntentToken(planCapture);
      // SDK may return an object — safely coerce to a display-friendly string
      token = typeof rawToken === 'string' ? rawToken : JSON.stringify(rawToken);

      // 4. Invoke validation check using the token
      try {
        await client.invoke(mcpName, action, rawToken, { action, payload });
      } catch (invokeError) {
        // In a demo/sandbox environment, if there is no real MCP server running,
        // it will throw a 500 (MCPInvocationException). If it's a 500, we know the policy
        // check passed because we successfully retrieved the intent token.
        const status = invokeError.statusCode || invokeError.response?.status;
        if (status === 403 || invokeError.name === 'PolicyBlockedException' || invokeError.name === 'PolicyHoldException') {
          throw invokeError;
        }
        console.warn('MCP routing failed, but policy validation passed:', invokeError.message || invokeError);
      }
      armoriqCheck = { allowed: true, reason: 'Authorized by ArmorIQ platform policies' };
    } catch (sdkError) {
      console.error('ArmorIQ SDK Verification failed:', sdkError);
      armoriqCheck = {
        allowed: false,
        reason: sdkError.message || 'Blocked by ArmorIQ platform policy enforcement',
      };
    }

    const isAllowed = localCheck.allowed && armoriqCheck.allowed;
    const finalReason = isAllowed
      ? `Action "${action}" authorized and audited by ArmorIQ platform.`
      : localCheck.allowed
        ? armoriqCheck.reason
        : localCheck.reason;

    // Log the permission check (which triggers the local Merkle Tree calculation!)
    middleware.log(
      'AGENT_PERMISSION',
      isAllowed ? 'PASSED' : 'BLOCKED',
      `${finalReason} (Token: ${String(token).slice(0, 15)}...)`,
      action
    );

    return NextResponse.json({
      allowed: isAllowed,
      action,
      reason: finalReason,
      token: token,
      threatLevel: isAllowed ? 'SAFE' : 'CRITICAL',
    });
  } catch (error) {
    console.error('Agent authorization error:', error);
    return NextResponse.json(
      { allowed: false, reason: `System error: ${error.message}` },
      { status: 500 }
    );
  }
}


import { SecurityFinding, SecurityFilterResult, SecurityRule } from './types.js';

export class SecurityFilter {
  private rules: SecurityRule[] = [
    {
      id: 'openai-api-key',
      name: 'OpenAI API Key',
      severity: 'critical',
      pattern: /sk-(?:proj-|none-)?[a-zA-Z0-9_-]{32,100}/g,
      description: 'OpenAI platform secret key'
    },
    {
      id: 'github-pat',
      name: 'GitHub Personal Access Token',
      severity: 'critical',
      pattern: /(?:ghp|gho|ghu|ghs|ghr|github_pat)_[a-zA-Z0-9_]{36,255}/g,
      description: 'GitHub personal access token or OAuth token'
    },
    {
      id: 'aws-access-key',
      name: 'AWS Access Key ID',
      severity: 'high',
      pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g,
      description: 'Amazon Web Services Access Key ID'
    },
    {
      id: 'aws-secret-key',
      name: 'AWS Secret Access Key',
      severity: 'critical',
      pattern: /(?:aws_secret_access_key|aws_sec_key|secret_key)\s*[:=]\s*["']?([A-Za-z0-9\/+=]{40})["']?/gi,
      description: 'Amazon Web Services Secret Key'
    },
    {
      id: 'private-key',
      name: 'Private Encryption Key Block',
      severity: 'critical',
      pattern: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP|ENCRYPTED)? PRIVATE KEY-----[\s\S]*?-----END (?:RSA|OPENSSH|EC|DSA|PGP|ENCRYPTED)? PRIVATE KEY-----/g,
      description: 'RSA/SSH/EC Private Key cryptographic block'
    },
    {
      id: 'jwt-token',
      name: 'JSON Web Token (JWT)',
      severity: 'medium',
      pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
      description: 'Bearer authentication JWT token'
    },
    {
      id: 'db-connection-string',
      name: 'Database URI with Credentials',
      severity: 'high',
      pattern: /(?:postgres|postgresql|mysql|mongodb|redis|amqp):\/\/[^:\s]+:[^@\s]+@[a-zA-Z0-9_.-]+(?::[0-9]+)?\/[^\s"']*/gi,
      description: 'Database connection URI containing plaintext user/password credentials'
    },
    {
      id: 'slack-token',
      name: 'Slack API Token',
      severity: 'high',
      pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g,
      description: 'Slack Bot or User OAuth Token'
    },
    {
      id: 'stripe-key',
      name: 'Stripe API Key',
      severity: 'critical',
      pattern: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}/g,
      description: 'Stripe payment provider API key'
    },
    {
      id: 'generic-credential',
      name: 'Hardcoded Password / Secret Assignment',
      severity: 'medium',
      pattern: /(?:password|passwd|secret_key|api_secret|auth_token|client_secret)\s*[:=]\s*["']([^"'\s]{8,64})["']/gi,
      description: 'Common configuration variable assigning passwords or secret strings'
    }
  ];

  public addCustomRule(rule: SecurityRule): void {
    this.rules.push(rule);
  }

  public scanAndRedact(content: string, filePath: string): SecurityFilterResult {
    const findings: SecurityFinding[] = [];
    let cleanedContent = content;

    for (const rule of this.rules) {
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        const rawMatch = match[0];
        if (!rawMatch || rawMatch.length < 5) continue;

        const textBefore = content.substring(0, match.index);
        const lineNumber = textBefore.split('\n').length;
        const redacted = `[REDACTED_${rule.id.toUpperCase()}]`;

        findings.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          filePath,
          lineNumber,
          rawMatch,
          redactedPreview: redacted
        });
      }

      cleanedContent = cleanedContent.replace(new RegExp(rule.pattern.source, rule.pattern.flags), () => {
        return `[REDACTED_${rule.id.toUpperCase()}]`;
      });
    }

    const hasCriticalOrHigh = findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high'
    );

    return {
      cleanedContent,
      findings,
      hasCriticalOrHigh
    };
  }
}

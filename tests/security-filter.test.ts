import { describe, it, expect } from 'vitest';
import { SecurityFilter } from '../src/core/security-filter.js';

describe('SecurityFilter', () => {
  const filter = new SecurityFilter();

  it('should detect and redact OpenAI API keys', () => {
    const raw = 'const key = "sk-proj-abc12345678901234567890123456789012";';
    const result = filter.scanAndRedact(raw, 'test.ts');
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].ruleId).toBe('openai-api-key');
    expect(result.cleanedContent).toContain('[REDACTED_OPENAI-API-KEY]');
  });

  it('should detect and redact GitHub tokens', () => {
    const raw = 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234";';
    const result = filter.scanAndRedact(raw, 'config.ts');
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].ruleId).toBe('github-pat');
    expect(result.cleanedContent).toContain('[REDACTED_GITHUB-PAT]');
  });

  it('should detect database URI credentials', () => {
    const raw = 'const uri = "mongodb://admin:supersecret123@cluster0.mongodb.net/dbname";';
    const result = filter.scanAndRedact(raw, 'db.ts');
    expect(result.findings.length).toBe(1);
    expect(result.findings[0].ruleId).toBe('db-connection-string');
  });
});

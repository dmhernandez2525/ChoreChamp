import { describe, expect, it } from 'vitest';
import { buildOpenApiDocument } from './api-platform';

describe('api platform route logic', () => {
  it('builds an OpenAPI document with expected auth schemes and paths', () => {
    const doc = buildOpenApiDocument();

    expect(doc.openapi).toBe('3.1.0');
    expect(doc.info.title).toContain('ChoreChamp Public API');

    const securitySchemes = (doc.components.securitySchemes ?? {}) as Record<string, unknown>;
    expect(securitySchemes).toHaveProperty('ApiKeyAuth');
    expect(securitySchemes).toHaveProperty('OAuth2');

    expect(doc.paths).toHaveProperty('/households/{householdId}/chores');
    expect(doc.paths).toHaveProperty('/households/{householdId}/members');
    expect(doc.paths).toHaveProperty('/households/{householdId}/events/{eventType}');
  });

  it('points OAuth client-credentials token URL at the API oauth token endpoint', () => {
    const doc = buildOpenApiDocument();
    const components = doc.components as {
      securitySchemes?: {
        OAuth2?: {
          flows?: {
            clientCredentials?: {
              tokenUrl?: string;
            };
          };
        };
      };
    };

    const tokenUrl = components.securitySchemes?.OAuth2?.flows?.clientCredentials?.tokenUrl;
    expect(tokenUrl).toBeDefined();
    expect(tokenUrl).toContain('/api/oauth/token');
  });
});

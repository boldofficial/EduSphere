import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('production custom-domain routing', () => {
  it('routes unmatched HTTPS hostnames to the tenant-aware frontend', () => {
    const compose = readFileSync(resolve(process.cwd(), 'docker-compose.yaml'), 'utf8');

    expect(compose).toContain('traefik.http.routers.frontend-custom.rule=PathPrefix(`/`)');
    expect(compose).toContain('traefik.http.routers.frontend-custom.entrypoints=https');
    expect(compose).toContain('traefik.http.routers.frontend-custom.tls=true');
    expect(compose).toContain('traefik.http.routers.frontend-custom.priority=1');
    expect(compose).not.toContain('traefik.http.routers.frontend-custom.tls.certresolver');
  });
});

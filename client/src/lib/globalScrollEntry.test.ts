import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('global route entry behavior', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/App.tsx'), 'utf8');

  it('resets the viewport to the top whenever the route changes', () => {
    expect(source).toContain('const [location] = useLocation();');
    expect(source).toContain('window.scrollTo({ top: 0, left: 0, behavior: "auto" });');
    expect(source).toContain('}, [location]);');
  });

  it('keeps the primary list and detail routes registered', () => {
    expect(source).toContain('path={"/trips"}');
    expect(source).toContain('path={"/shared-homes"}');
    expect(source).toContain('path={"/group-funds"}');
    expect(source).toContain('path={"/trip/:id"}');
    expect(source).toContain('path={"/shared-home/:id"}');
    expect(source).toContain('path={"/more"}');
  });
});

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Trip Detail opening behavior', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/pages/TripDetail.tsx'), 'utf8');

  it('selects Dashboard as the initial tab and resets the page scroll when entering a Trip', () => {
    expect(source).toContain("useState('dashboard')");
    expect(source).toContain("setActiveTab('dashboard');");
    expect(source).toContain("window.scrollTo({ top: 0, left: 0, behavior: 'auto' });");
    expect(source).toContain('}, [tripId]);');
    expect(source).not.toContain("const [activeTab, setActiveTab] = useState('members');");
  });

  it('keeps the existing tab navigation values available', () => {
    expect(source).toContain('value="expenses"');
    expect(source).toContain('value="members"');
    expect(source).toContain('value="settle"');
    expect(source).toContain('value="reports"');
  });
});

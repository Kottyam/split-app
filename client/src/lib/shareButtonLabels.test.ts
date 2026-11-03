import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('detail-page Share buttons', () => {
  const tripSource = readFileSync(resolve(process.cwd(), 'client/src/pages/TripDetail.tsx'), 'utf8');
  const sharedHomeSource = readFileSync(resolve(process.cwd(), 'client/src/pages/SharedHomeDetail.tsx'), 'utf8');
  const groupFundSource = readFileSync(resolve(process.cwd(), 'client/src/pages/GroupFundDetail.tsx'), 'utf8');

  it('uses the localized Share label and Kharcha green styling on each top control', () => {
    expect(tripSource).toContain("{t('sharedHomeShare' as any)}");
    expect(sharedHomeSource).toContain("{t('sharedHomeShare')}</Button>");
    expect(groupFundSource).toContain("{t('sharedHomeShare')}");
    expect(tripSource).toContain('variant="soft" onClick={() => setShowShareTrip(true)}');
    expect(sharedHomeSource).toContain('bg-[#16834b]');
    expect(groupFundSource).toContain('variant="fund" onClick={() => setShowEditSync(true)}');
  });

  it('preserves the existing share handlers for all three detail pages', () => {
    expect(tripSource).toContain('onClick={() => setShowShareTrip(true)}');
    expect(sharedHomeSource).toContain('onClick={() => setShowShare(true)}');
    expect(groupFundSource).toContain('onClick={() => setShowEditSync(true)}');
  });
});

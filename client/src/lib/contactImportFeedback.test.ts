import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), 'utf8');

describe('contact import responsiveness', () => {
  it('gives Group Fund users immediate feedback and prevents duplicate imports', () => {
    const source = read('client/src/pages/GroupFundDetail.tsx');
    expect(source).toContain('isImportingContacts');
    expect(source).toContain('setIsImportingContacts(true)');
    expect(source).toContain('setIsImportingContacts(false)');
    expect(source).toContain('disabled={isImportingContacts}');
    expect(source).toContain('className="mr-1 animate-spin"');
    expect(source).toContain("t('picking')");
  });

  it('keeps Shared Home contact import feedback consistent', () => {
    const source = read('client/src/components/SharedHomeMemberDialog.tsx');
    expect(source).toContain('isPickingContact');
    expect(source).toContain('setIsPickingContact(true)');
    expect(source).toContain('setIsPickingContact(false)');
    expect(source).toContain('disabled={isPickingContact}');
    expect(source).toContain('animate-spin');
    expect(source).toContain("t('picking')");
  });

  it('wires Shared Home to its one-shot multi-member saver', () => {
    const source = read('client/src/pages/SharedHomeDetail.tsx');
    expect(source).toContain('onSaveMultiple={saveMultipleMembers}');
    expect(source).toContain('appendUniqueMembers(home.members, newMembers)');
  });

  it('keeps Group Fund contact imports batched in one members update', () => {
    const source = read('client/src/pages/GroupFundDetail.tsx');
    expect(source).toContain('appendUniqueMembers(latestFund.members, incomingMembers)');
    expect(source).toContain('members,');
  });

  it('uses a background executor and virtualized list in the native picker', () => {
    const source = read('android-app/app/src/main/java/app/kharcha/splitter/MainActivity.java');
    expect(source).toContain('contactExecutor.execute');
    expect(source).toContain('showContactLoading');
    expect(source).toContain('new ListView(this)');
    expect(source).toContain('ContactListAdapter extends BaseAdapter');
    expect(source).toContain('contactRequestInFlight');
  });
});

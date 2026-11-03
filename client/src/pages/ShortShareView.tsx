import SharedView from './SharedView';
import SharedFundView from './SharedFundView';

/** /s/t<data> opens a shared trip, /s/f<data> opens a shared Group Fund. */
export default function ShortShareView() {
  const kind = typeof window === 'undefined' ? '' : window.location.pathname.match(/\/s\/([tf])/)?.[1];
  return kind === 'f' ? <SharedFundView /> : <SharedView />;
}

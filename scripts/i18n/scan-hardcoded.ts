import { scanHardcodedStrings } from './hardcodedScan';

const hits = scanHardcodedStrings(process.argv[2] ?? 'client/src');
console.log(hits.join('\n'));
console.error('hits', hits.length);

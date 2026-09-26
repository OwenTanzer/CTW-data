// RPFM exports literal tab-separated fields. Quotes inside localized prose are
// data, not CSV delimiters; treating them as delimiters can swallow later rows.
export function parseRpfmTsv(text) {
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line !== '').map(line => line.split('\t'));
  const width = rows[0]?.length ?? 0;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0].startsWith('#')) continue;
    if (rows[i].length !== width) throw Error(`RPFM TSV row ${i + 1}: expected ${width} columns, got ${rows[i].length}`);
  }
  return rows;
}

export function validateProbeRequest(request) {
  if (!Array.isArray(request?.paths) || !request.paths.length || request.paths.length > 100)
    throw Error('Probe requires 1–100 exact paths');
  if (new Set(request.paths).size !== request.paths.length) throw Error('Duplicate source path');
  for (const p of request.paths) {
    if (typeof p !== 'string' || !/^(terrain|db|text|prefabs)\//.test(p) ||
        p.split('/').some(part => !part || part === '.' || part === '..') || /[\\\x00-\x1f:]/.test(p))
      throw Error('Unsafe source path');
  }
  if (request.decode !== undefined && !Array.isArray(request.decode)) throw Error('Decode must be an array');
  for (const p of request.decode ?? [])
    if (!request.paths.includes(p)) throw Error('Decode path not requested for extraction');
  return request;
}

export function decoderProbeStatus(response) {
  // The RPFM server deliberately skips BMDs; Unknown is not a decoded layer.
  return response === null || response === 'Unknown' ||
    (typeof response === 'object' && Object.hasOwn(response, 'Unknown'))
    ? 'not_exposed_by_server' : 'decoder_returned_unvalidated';
}

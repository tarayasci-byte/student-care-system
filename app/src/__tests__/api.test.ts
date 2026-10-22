import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiMessage, isTransient, sheetsApi } from '../api/sheets';

const URL = 'https://script.google.com/macros/s/x/exec';
const respond = (body: string, status = 200) => vi.fn().mockResolvedValue(new Response(body, { status }));
const codeOf = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as ApiError).code; } };

afterEach(() => vi.unstubAllGlobals());

describe('Apps Script error mapping', () => {
  it('reports a web page instead of JSON as a temporary problem, not a wrong URL', async () => {
    vi.stubGlobal('fetch', respond('<html>Google error</html>'));
    expect(await codeOf(sheetsApi.save(URL, 't', '2569', { students: [], updatedAt: '' }))).toBe('unreadable');
    expect(isTransient(new ApiError('unreadable'))).toBe(true);
  });

  it('still says "wrong URL" when the very first check gets a web page', async () => {
    vi.stubGlobal('fetch', respond('<html>not a script</html>'));
    expect(await codeOf(sheetsApi.status(URL))).toBe('bad_response');
  });

  it('maps HTTP status codes', async () => {
    vi.stubGlobal('fetch', respond('', 404));
    expect(await codeOf(sheetsApi.load(URL, 't'))).toBe('not_found');
    vi.stubGlobal('fetch', respond('', 503));
    expect(await codeOf(sheetsApi.load(URL, 't'))).toBe('busy');
  });

  it('distinguishes network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await codeOf(sheetsApi.load(URL, 't'))).toBe('network');
  });

  it('passes known script errors through and shows the script message for server errors', async () => {
    vi.stubGlobal('fetch', respond(JSON.stringify({ ok: false, error: 'session' })));
    expect(await codeOf(sheetsApi.load(URL, 't'))).toBe('session');
    vi.stubGlobal('fetch', respond(JSON.stringify({ ok: false, error: 'server', message: 'Exception: Too many rows' })));
    try { await sheetsApi.load(URL, 't'); } catch (e) {
      expect((e as ApiError).code).toBe('server');
      expect(apiMessage(e)).toContain('Exception: Too many rows');
    }
    vi.stubGlobal('fetch', respond(JSON.stringify({ ok: false, error: 'token' })));
    expect(await codeOf(sheetsApi.load(URL, 't'))).toBe('outdated');
  });
});

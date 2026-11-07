import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

describe('Cloudflare Worker Edge API Tests', () => {
  const mockEnv = {
    CLIENT_COMPANY: 'Original Glazing 24/7 Melbourne',
    ABN: '27 564 832 883',
    EMERGENCY_DISPATCH_PHONE: '+61411946933'
  };
  const mockCtx = {
    waitUntil: (promise) => promise
  };

  test('GET /api/health returns 200 OK with edge diagnostics', async () => {
    const req = new Request('https://api.originalglazing.com.au/api/health', {
      method: 'GET',
      headers: { 'cf-ipcountry': 'AU' }
    });
    const res = await worker.fetch(req, mockEnv, mockCtx);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ONLINE');
    assert.equal(data.abn, '27 564 832 883');
    assert.ok(data.latency_ms >= 0);
  });

  test('POST /api/emergency-quote validates mandatory phone number', async () => {
    const req = new Request('https://api.originalglazing.com.au/api/emergency-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe', phone: '123' })
    });
    const res = await worker.fetch(req, mockEnv, mockCtx);
    assert.equal(res.status, 422);
    const data = await res.json();
    assert.match(data.error, /Australian phone number/i);
  });

  test('POST /api/emergency-quote creates verified lead and returns direct WhatsApp link', async () => {
    const req = new Request('https://api.originalglazing.com.au/api/emergency-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'David Test',
        phone: '0411 946 933',
        suburb: 'Balwyn North',
        urgency: '24/7 Emergency Make-Safe',
        glassSpec: '6.38mm Architectural Safety Laminate',
        width: 1400,
        height: 1800,
        panelArea: 2.52,
        panelWeight: 39.8
      })
    });
    const res = await worker.fetch(req, mockEnv, mockCtx);
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.match(data.leadId, /^AET-MEL-/);
    assert.equal(data.directGlazierPhone, '+61411946933');
    assert.ok(data.whatsAppUrgentLink.includes('wa.me/61411946933'));
  });

  test('OPTIONS request returns 204 with full CORS headers', async () => {
    const req = new Request('https://api.originalglazing.com.au/api/emergency-quote', {
      method: 'OPTIONS'
    });
    const res = await worker.fetch(req, mockEnv, mockCtx);
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
  });
});

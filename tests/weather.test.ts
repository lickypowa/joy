import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTomorrowWeather } from '../src/features/weather/weather.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe('getTomorrowWeather', () => {
  it('returns tomorrow values from Open-Meteo daily arrays', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ daily: {
      time: ['2026-10-29', '2026-10-30'], weather_code: [0, 61],
      temperature_2m_max: [20, 21], temperature_2m_min: [12, 13],
      precipitation_probability_max: [10, 70],
    } }), { status: 200 })) as typeof fetch;
    const report = await getTomorrowWeather(38.1, 13.3, 'Palermo');
    assert.equal(report.forecastDate, '2026-10-30');
    assert.equal(report.code, 61);
    assert.equal(report.maxTemperature, 21);
    assert.equal(report.minTemperature, 13);
    assert.equal(report.rainChance, 70);
  });

  it('rejects an incomplete forecast response', async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify({ daily: { weather_code: [0] } }), { status: 200 })) as typeof fetch;
    await assert.rejects(getTomorrowWeather(38.1, 13.3, 'Palermo'), /incomplete/);
  });
});

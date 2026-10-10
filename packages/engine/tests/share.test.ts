/**
 * Share-link encode/decode tests. Malformed query strings must decode to
 * null — the web UI then ignores the link and shows the default form.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { encodeShareParams, decodeShareParams, type ShareParams } from '../src/share.ts';

const SAMPLE: ShareParams = {
  date: '2000-12-01',
  time: '07:30',
  utcOffset: -5,
  longitude: -73.9,
  gender: 'female',
  lang: 'en',
};

describe('share links', () => {
  it('round-trips a full parameter set', () => {
    const encoded = encodeShareParams(SAMPLE);
    assert.equal(typeof encoded, 'string');
    assert.deepEqual(decodeShareParams(encoded), SAMPLE);
  });

  it('round-trips when longitude is omitted', () => {
    const noLon: ShareParams = { ...SAMPLE, longitude: undefined };
    assert.deepEqual(decodeShareParams(encodeShareParams(noLon)), noLon);
  });

  it('round-trips a half hour timezone offset', () => {
    const halfHour: ShareParams = { ...SAMPLE, utcOffset: 5.5 };
    assert.deepEqual(decodeShareParams(encodeShareParams(halfHour)), halfHour);
  });

  it('accepts a leading question mark', () => {
    assert.deepEqual(decodeShareParams('?' + encodeShareParams(SAMPLE)), SAMPLE);
  });

  it('defaults the timezone to UTC+8 when tz is absent', () => {
    const q = new URLSearchParams({ date: '2000-12-01', time: '07:30', gender: 'male', lang: 'zh' });
    const got = decodeShareParams(q.toString());
    assert.equal(got?.utcOffset, 8);
  });

  it('rejects impossible dates like 2023-02-29', () => {
    const q = new URLSearchParams({ date: '2023-02-29', time: '07:30', gender: 'male', lang: 'en' });
    assert.equal(decodeShareParams(q.toString()), null);
  });

  it('rejects malformed dates and times', () => {
    const base = { time: '07:30', gender: 'male', lang: 'en' } as const;
    for (const date of ['2000-13-01', '2000-00-10', '01/12/2000', '', 'notadate']) {
      const q = new URLSearchParams({ ...base, date });
      assert.equal(decodeShareParams(q.toString()), null, date);
    }
    for (const time of ['25:00', '07:60', '7:30', '', 'noon']) {
      const q = new URLSearchParams({ ...base, date: '2000-12-01', time });
      assert.equal(decodeShareParams(q.toString()), null, time);
    }
  });

  it('rejects missing date or time', () => {
    assert.equal(decodeShareParams('gender=male&lang=en'), null);
    assert.equal(decodeShareParams('date=2000-12-01&gender=male&lang=en'), null);
    assert.equal(decodeShareParams(''), null);
  });

  it('rejects out-of-range timezones and longitudes', () => {
    const base = { date: '2000-12-01', time: '07:30', gender: 'male', lang: 'en' } as const;
    for (const tz of ['15', '-13', '5.25', 'abc']) {
      const q = new URLSearchParams({ ...base, tz });
      assert.equal(decodeShareParams(q.toString()), null, tz);
    }
    assert.deepEqual(decodeShareParams(new URLSearchParams({ ...base, tz: '5.5' }).toString())?.utcOffset, 5.5);
    for (const lon of ['181', '-180.1', 'abc']) {
      const q = new URLSearchParams({ ...base, lon });
      assert.equal(decodeShareParams(q.toString()), null, lon);
    }
  });

  it('treats an empty lon param as omitted', () => {
    const base = { date: '2000-12-01', time: '07:30', gender: 'male', lang: 'en' } as const;
    const got = decodeShareParams(new URLSearchParams({ ...base, lon: '' }).toString());
    assert.equal(got?.longitude, undefined);
  });

  it('rejects unknown gender or lang values', () => {    const base = { date: '2000-12-01', time: '07:30', lang: 'en' } as const;
    assert.equal(decodeShareParams(new URLSearchParams({ ...base, gender: 'x' }).toString()), null);
    assert.equal(decodeShareParams(new URLSearchParams({ ...base, gender: 'male', lang: 'fr' }).toString()), null);
  });
});

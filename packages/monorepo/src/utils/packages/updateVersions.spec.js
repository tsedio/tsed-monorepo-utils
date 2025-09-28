import {updateVersions} from './updateVersions.js';

function makeCtx(overrides = {}) {
  const logs = {info: []};
  return {
    silent: true,
    logger: {
      info: (...args) => logs.info.push(args.join(' '))
    },
    _logs: logs,
    ...overrides
  };
}

describe('updateVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates version when dependency map has a newer valid semver and logs (with optional char)', () => {
    const depsMap = new Map([
      ['@scope/a', '2.0.0'],
      ['@scope/b', '1.5.0']
    ]);

    const field = {
      '@scope/a': '^1.0.0',
      '@scope/b': '1.0.0',
      '@scope/c': '0.1.0' // not in map, should remain untouched
    };

    const ctx = makeCtx({silent: false});

    const out = updateVersions(field, depsMap, {char: '^'}, ctx);

    // Mutates in place and returns the same object
    expect(out).toBe(field);

    // a updated from ^1.0.0 -> ^2.0.0 (caret stripped for comparison, re-added via char)
    expect(field['@scope/a']).toBe('^2.0.0');
    // b updated from 1.0.0 -> ^1.5.0
    expect(field['@scope/b']).toBe('^1.5.0');
    // c unchanged (not in dependencies map)
    expect(field['@scope/c']).toBe('0.1.0');

    // logs should include update lines when not silent
    expect(ctx._logs.info.length).toBeGreaterThan(0);
  });

  it('does not update when new version is older/equal or when versions are invalid', () => {
    const depsMap = new Map([
      ['older', '0.9.0'], // older than current 1.0.0
      ['equal', '1.0.0'], // equal
      ['invalidNew', 'workspace:*'] // invalid semver should be ignored
    ]);

    const field = {
      older: '1.0.0',
      equal: '^1.0.0',
      invalidNew: '0.1.0',
      invalidCurrent: 'link:../local' // invalid current means no update either
    };

    const before = JSON.parse(JSON.stringify(field));

    const ctx = makeCtx({silent: true});

    const out = updateVersions(field, depsMap, {}, ctx);

    // unchanged
    expect(out).toEqual(before);
  });
});

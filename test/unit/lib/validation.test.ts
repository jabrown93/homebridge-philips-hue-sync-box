import { describe, it, expect } from '@jest/globals';
import {
  isPlainObject,
  isValidState,
  validateExecution,
  validateHue,
} from '../../../src/lib/validation.js';
import { State } from '../../../src/state.js';

function makeState(groups: Record<string, { name: string }>): State {
  return {
    hue: {
      bridgeUniqueId: 'bridge-1',
      bridgeIpAddress: '10.0.0.5',
      groupId: '',
      groups: groups as State['hue']['groups'],
      connectionState: 'linked',
    },
  } as State;
}

function makeFullState(): State {
  return {
    device: {
      name: 'Sync Box',
      firmwareVersion: '1.0.0',
      uniqueId: 'unique-id',
    },
    execution: { mode: 'video' },
    hue: makeState({}).hue,
    hdmi: {},
  } as State;
}

describe('isPlainObject', () => {
  it('accepts plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('rejects arrays, null, and primitives', () => {
    expect(isPlainObject([1, 2, 3])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject('a string')).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });
});

describe('isValidState', () => {
  it('accepts a well-formed state', () => {
    expect(isValidState(makeFullState())).toBe(true);
  });

  it('rejects a response missing execution entirely', () => {
    const { execution: _execution, ...rest } = makeFullState();
    expect(isValidState(rest)).toBe(false);
  });

  it('rejects a response where execution.mode is not a string', () => {
    const state = { ...makeFullState(), execution: { mode: 42 } };
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a response missing device fields', () => {
    const state = { ...makeFullState(), device: { name: 'Sync Box' } };
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a response missing hue or hdmi', () => {
    const { hue: _hue, ...withoutHue } = makeFullState();
    expect(isValidState(withoutHue)).toBe(false);
    const { hdmi: _hdmi, ...withoutHdmi } = makeFullState();
    expect(isValidState(withoutHdmi)).toBe(false);
  });

  it('rejects non-object and null responses', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState(undefined)).toBe(false);
    expect(isValidState('not an object')).toBe(false);
    expect(isValidState([])).toBe(false);
  });
});

describe('validateExecution', () => {
  it('accepts a valid mode', () => {
    const result = validateExecution({ mode: 'video' });
    expect(result).toEqual({ ok: true, value: { mode: 'video' } });
  });

  it('rejects an unrecognized mode', () => {
    const result = validateExecution({ mode: 'literally-anything' });
    expect(result.ok).toBe(false);
  });

  it('accepts brightness within range', () => {
    const result = validateExecution({ brightness: 150 });
    expect(result).toEqual({ ok: true, value: { brightness: 150 } });
  });

  it('rejects negative brightness', () => {
    const result = validateExecution({ brightness: -99999 });
    expect(result.ok).toBe(false);
  });

  it('rejects brightness above the Sync Box max', () => {
    const result = validateExecution({ brightness: 201 });
    expect(result.ok).toBe(false);
  });

  it('rejects non-finite brightness', () => {
    expect(validateExecution({ brightness: Infinity }).ok).toBe(false);
    expect(validateExecution({ brightness: NaN }).ok).toBe(false);
  });

  it('accepts a well-formed hdmiSource', () => {
    const result = validateExecution({ hdmiSource: 'input2' });
    expect(result).toEqual({ ok: true, value: { hdmiSource: 'input2' } });
  });

  it('rejects an out-of-range or malformed hdmiSource', () => {
    expect(validateExecution({ hdmiSource: 'input999999999' }).ok).toBe(false);
    expect(validateExecution({ hdmiSource: 'anything' }).ok).toBe(false);
  });

  it('accepts a valid video intensity payload', () => {
    const result = validateExecution({ video: { intensity: 'high' } });
    expect(result).toEqual({
      ok: true,
      value: { video: { intensity: 'high' } },
    });
  });

  it('rejects an invalid intensity value', () => {
    const result = validateExecution({ video: { intensity: 'extreme' } });
    expect(result.ok).toBe(false);
  });

  it('rejects extra fields inside a mode sub-object', () => {
    const result = validateExecution({
      video: { intensity: 'high', backgroundLighting: true },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects unrecognized top-level fields', () => {
    const result = validateExecution({ hueTarget: 'somewhere' });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-object payload', () => {
    expect(validateExecution('video').ok).toBe(false);
    expect(validateExecution(null).ok).toBe(false);
    expect(validateExecution([1, 2, 3]).ok).toBe(false);
  });

  it('rejects an empty object', () => {
    expect(validateExecution({}).ok).toBe(false);
  });

  it('accepts multiple valid fields together', () => {
    const result = validateExecution({ mode: 'game', brightness: 100 });
    expect(result).toEqual({
      ok: true,
      value: { mode: 'game', brightness: 100 },
    });
  });
});

describe('validateHue', () => {
  it('accepts a groupId that exists in the current state', () => {
    const state = makeState({ 'group-1': { name: 'Living Room' } });
    const result = validateHue({ groupId: 'group-1' }, state);
    expect(result).toEqual({ ok: true, value: { groupId: 'group-1' } });
  });

  it('rejects a groupId that does not exist in the current state', () => {
    const state = makeState({ 'group-1': { name: 'Living Room' } });
    const result = validateHue({ groupId: 'unknown-group' }, state);
    expect(result.ok).toBe(false);
  });

  it('rejects when state is null', () => {
    const result = validateHue({ groupId: 'group-1' }, null);
    expect(result.ok).toBe(false);
  });

  it('rejects a non-string groupId', () => {
    const state = makeState({ 'group-1': { name: 'Living Room' } });
    expect(validateHue({ groupId: 123 }, state).ok).toBe(false);
  });

  it('rejects extra fields', () => {
    const state = makeState({ 'group-1': { name: 'Living Room' } });
    const result = validateHue(
      { groupId: 'group-1', somethingElse: true },
      state
    );
    expect(result.ok).toBe(false);
  });

  it('rejects a non-object payload', () => {
    expect(validateHue('group-1', null).ok).toBe(false);
  });
});

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { getPalette, themeOptions, withAlpha } from './theme';

const SRC = join(import.meta.dirname, '.');

// theme.ts is the single source of colour. notifications.ts passes a colour to a
// native channel that cannot read React state, so it imports the static palette
// rather than hardcoding one — it is allowed to name the token, not a literal.
const ALLOWED = new Set(['theme.ts', 'theme.test.ts']);

const COLOUR_LITERAL = /#[0-9A-Fa-f]{3,8}\b|rgba?\(\s*\d/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name)) return [];
    if (ALLOWED.has(entry.name)) return [];
    return [path];
  });
}

test('no colour literal escapes theme.ts', () => {
  const offenders: string[] = [];

  for (const file of sourceFiles(SRC)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      // Skip comments: they often quote the old values for context.
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (COLOUR_LITERAL.test(code)) {
        const relative = file.slice(SRC.length + 1).replace(/\\/g, '/');
        offenders.push(`${relative}:${index + 1}  ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `Hardcoded colours do not follow the theme — the pink and blue themes would ` +
      `stay green wherever these are used. Move them into src/theme.ts, or build ` +
      `them with withAlpha(colors.<token>, alpha):\n\n${offenders.join('\n')}\n`,
  );
});

test('every theme derives its own structural colours', () => {
  const structural = [
    'background',
    'backgroundDeep',
    'card',
    'cardStrong',
    'vignette',
    'divider',
    'overlay',
  ] as const;

  const teal = getPalette('teal');

  for (const { id } of themeOptions) {
    if (id === 'teal') continue;
    const palette = getPalette(id);

    for (const token of structural) {
      assert.notEqual(
        palette[token],
        teal[token],
        `${id}.${token} is identical to teal — it is not derived from the theme`,
      );
    }
    assert.equal(palette.ornamentGradient.length, 3);
    assert.notDeepEqual(palette.ornamentGradient, teal.ornamentGradient);
    assert.notDeepEqual(palette.shareGradient, teal.shareGradient);
  }
});

test('the teal cards keep the exact colour they had before the refactor', () => {
  const teal = getPalette('teal');
  assert.equal(teal.card, 'rgba(25,56,42,0.94)');
  assert.equal(teal.cardStrong, 'rgba(25,56,42,0.95)');
});

test('withAlpha builds an rgba string from any hex form', () => {
  assert.equal(withAlpha('#D4A373', 0.12), 'rgba(212,163,115,0.12)');
  assert.equal(withAlpha('#FFF', 0.5), 'rgba(255,255,255,0.5)');
});

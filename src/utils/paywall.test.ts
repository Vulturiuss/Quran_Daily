import assert from 'node:assert/strict';
import test from 'node:test';

import { formatFreeTrialPeriod, getPackageFreeTrialLabel } from '@/utils/paywall';

test('formats a seven day trial from an Apple introductory price', () => {
  assert.equal(
    getPackageFreeTrialLabel({
      product: {
        introPrice: {
          periodNumberOfUnits: 7,
          periodUnit: 'DAY',
          price: 0,
        },
      },
    }),
    '7 jours gratuits',
  );
});

test('formats a Google Play one week free phase as seven days', () => {
  assert.equal(
    getPackageFreeTrialLabel({
      product: {
        defaultOption: {
          freePhase: {
            billingPeriod: {
              unit: 'WEEK',
              value: 1,
            },
            price: {
              amountMicros: 0,
            },
          },
        },
      },
    }),
    '7 jours gratuits',
  );
});

test('ignores paid intro offers and unknown periods', () => {
  assert.equal(
    getPackageFreeTrialLabel({
      product: {
        introPrice: {
          periodNumberOfUnits: 1,
          periodUnit: 'MONTH',
          price: 1.99,
        },
      },
    }),
    undefined,
  );
  assert.equal(formatFreeTrialPeriod('UNKNOWN', 1), undefined);
});

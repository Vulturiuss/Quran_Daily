import { createContext, useContext } from 'react';

import { CheckedWord } from '@/utils/recitationReview';

/**
 * Carries the result of a spoken-recitation check down to each verse row.
 *
 * The review screen renders its verses through a virtualised FlatList of memoised
 * rows, so threading verdicts as props would fight the memoisation. A context lets
 * only `RecitationText` subscribe: when a check produces coloured words it re-reads
 * them, and every row that was not recited keeps rendering exactly as before.
 *
 * The default returns `undefined` for every verse, so a `RecitationText` used
 * anywhere without a provider (or before any recitation) behaves as plain text.
 */
export interface RecitationCheckValue {
  wordsForVerse(verseNumber: number): CheckedWord[] | undefined;
}

const RecitationCheckContext = createContext<RecitationCheckValue>({
  wordsForVerse: () => undefined,
});

export const RecitationCheckProvider = RecitationCheckContext.Provider;

export function useRecitationCheck(): RecitationCheckValue {
  return useContext(RecitationCheckContext);
}

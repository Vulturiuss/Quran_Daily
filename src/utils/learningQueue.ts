import { getSurah } from '@/data/surahs';
import { UserProfile, UserSurahProgress } from '@/types';

interface LearningState {
  progress: Record<number, UserSurahProgress>;
  profile: UserProfile;
}

/**
 * Repairs learning state that earlier versions could corrupt.
 *
 * A surah could be both the active learning surah and sit in the queue. On
 * completion the head of the queue was promoted blindly, so the surah promoted
 * itself: its status flipped back from `known` to `learning` while
 * `versesLearned === totalVerses`. It then showed 100% forever and the next
 * surah never took over. Stored state has to be healed, not just the code path.
 *
 * Rules:
 * - a `learning` surah with every verse learnt is actually `known`;
 * - the queue never holds the active surah nor an already-known one;
 * - if nothing is being learnt, the head of the queue takes over.
 */
export function healLearningState({ progress, profile }: LearningState): LearningState {
  const nextProgress: Record<number, UserSurahProgress> = {};
  let changed = false;

  for (const [key, item] of Object.entries(progress)) {
    const surahNumber = Number(key);
    if (
      item.status === 'learning' &&
      item.totalVerses > 0 &&
      item.versesLearned >= item.totalVerses
    ) {
      changed = true;
      nextProgress[surahNumber] = {
        ...item,
        status: 'known',
        nextReviewAt: item.nextReviewAt ?? new Date().toISOString(),
      };
      continue;
    }
    nextProgress[surahNumber] = item;
  }

  const queue = profile.learningQueue ?? [];
  let nextQueue = queue.filter((surahNumber) => {
    const status = nextProgress[surahNumber]?.status;
    return status !== 'known' && status !== 'learning';
  });
  if (nextQueue.length !== queue.length) changed = true;

  const hasLearning = Object.values(nextProgress).some(
    (item) => item.status === 'learning',
  );
  if (!hasLearning && nextQueue.length > 0) {
    const [promoted, ...rest] = nextQueue;
    nextQueue = rest;
    changed = true;
    // totalVerses must come from the surah metadata: a zero would render the
    // learning progress as 0/0 -> NaN%.
    nextProgress[promoted] = {
      ...(nextProgress[promoted] ?? {
        surahNumber: promoted,
        versesLearned: 0,
        totalVerses: getSurah(promoted)?.totalVerses ?? 0,
        reviewIntervalDays: 1,
        easeFactor: 2.5,
        reviewCount: 0,
      }),
      status: 'learning',
      updatedAt: new Date().toISOString(),
    };
  }

  if (!changed) return { progress, profile };

  return {
    progress: nextProgress,
    profile: { ...profile, learningQueue: nextQueue },
  };
}

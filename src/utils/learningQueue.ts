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
      item.versesLearned >= item.totalVerses &&
      // A surah sent BACK to learning by a failed final recitation also has every
      // verse "learnt" — it has weak verses to drill. Pushing it to `verifying`
      // here would undo the failure on the next cloud sync (healLearningState runs
      // on every incoming snapshot), so the weak verses would never be worked and
      // the user would be stuck re-taking the check they just failed.
      (item.weakVerses ?? []).length === 0
    ) {
      changed = true;
      // Every verse has been seen, so it is no longer being learnt — but it is not
      // known either until it has been recited whole. It goes to the final check,
      // not straight into the SRS.
      nextProgress[surahNumber] = { ...item, status: 'verifying' };
      continue;
    }
    nextProgress[surahNumber] = item;
  }

  const queue = profile.learningQueue ?? [];
  let nextQueue = queue.filter((surahNumber) => {
    const status = nextProgress[surahNumber]?.status;
    // A surah awaiting its final recitation has no business queueing to be
    // learnt again either.
    return status !== 'known' && status !== 'learning' && status !== 'verifying';
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

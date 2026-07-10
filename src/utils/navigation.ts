import { router } from 'expo-router';

type RouterTarget = Parameters<typeof router.replace>[0];

export function goBackOrReplace(fallback: RouterTarget) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}

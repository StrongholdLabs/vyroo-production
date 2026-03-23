const ONBOARDING_KEY = 'vyroo-onboarding-complete';

export function useOnboarding() {
  const isComplete = localStorage.getItem(ONBOARDING_KEY) === 'true';

  const complete = () => localStorage.setItem(ONBOARDING_KEY, 'true');
  const reset = () => localStorage.removeItem(ONBOARDING_KEY);

  return { isComplete, complete, reset };
}

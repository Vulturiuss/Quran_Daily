type IntroPriceLike = {
  price?: number | null;
  periodUnit?: string | null;
  periodNumberOfUnits?: number | null;
};

type FreePhaseLike = {
  billingPeriod?: {
    unit?: string | null;
    value?: number | null;
  } | null;
  price?: {
    amountMicros?: number | null;
  } | null;
};

type TrialPackageLike = {
  product?: {
    defaultOption?: {
      freePhase?: FreePhaseLike | null;
    } | null;
    introPrice?: IntroPriceLike | null;
  } | null;
};

export function formatFreeTrialPeriod(unit?: string | null, count?: number | null) {
  if (!unit || !count || count < 1) return undefined;

  switch (unit.toUpperCase()) {
    case 'DAY':
      return `${count} jour${count > 1 ? 's' : ''} gratuit${count > 1 ? 's' : ''}`;
    case 'WEEK':
      if (count === 1) return '7 jours gratuits';
      return `${count} semaines gratuites`;
    case 'MONTH':
      return `${count} mois gratuit${count > 1 ? 's' : ''}`;
    case 'YEAR':
      return `${count} an${count > 1 ? 's' : ''} gratuit${count > 1 ? 's' : ''}`;
    default:
      return undefined;
  }
}

export function getPackageFreeTrialLabel(aPackage?: TrialPackageLike | null) {
  const introPrice = aPackage?.product?.introPrice;
  if (introPrice?.price === 0) {
    return formatFreeTrialPeriod(
      introPrice.periodUnit,
      introPrice.periodNumberOfUnits,
    );
  }

  const freePhase = aPackage?.product?.defaultOption?.freePhase;
  if (freePhase?.price?.amountMicros === 0) {
    return formatFreeTrialPeriod(
      freePhase.billingPeriod?.unit,
      freePhase.billingPeriod?.value,
    );
  }

  return undefined;
}

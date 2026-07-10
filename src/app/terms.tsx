import { LegalDocument } from '@/components/LegalDocument';
import { termsSections } from '@/content/legal';

export default function TermsScreen() {
  return (
    <LegalDocument
      externalUrl={process.env.EXPO_PUBLIC_TERMS_URL?.trim()}
      sections={termsSections}
      subtitle="Les règles applicables à l’utilisation de Quran Daily."
      title="Conditions d’utilisation"
    />
  );
}

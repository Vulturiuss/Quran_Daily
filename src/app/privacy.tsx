import { LegalDocument } from '@/components/LegalDocument';
import { privacySections } from '@/content/legal';

export default function PrivacyScreen() {
  return (
    <LegalDocument
      externalUrl={process.env.EXPO_PUBLIC_PRIVACY_URL?.trim()}
      sections={privacySections}
      subtitle="Comment Quran Daily utilise et protège tes données."
      title="Confidentialité"
    />
  );
}

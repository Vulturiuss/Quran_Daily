import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { Card, IconButton, ScreenTitle } from '@/components/ui';
import {
  LegalSection,
  legalUpdatedAt,
  supportEmail,
} from '@/content/legal';
import { colors, radius, spacing, typography } from '@/theme';
import { goBackOrReplace } from '@/utils/navigation';

interface LegalDocumentProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  externalUrl?: string;
}

export function LegalDocument({
  title,
  subtitle,
  sections,
  externalUrl,
}: LegalDocumentProps) {
  return (
    <AppScreen>
      <ScreenTitle
        title={title}
        subtitle={subtitle}
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/settings')}
          />
        }
      />

      <Text style={styles.updated}>Dernière mise à jour : {legalUpdatedAt}</Text>

      {sections.map((section) => (
        <Card key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
          {section.bullets?.map((bullet) => (
            <View key={bullet} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </Card>
      ))}

      <View style={styles.links}>
        {supportEmail ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(`mailto:${supportEmail}`)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Mail color={colors.gold} size={18} />
            <Text style={styles.linkText}>{supportEmail}</Text>
          </Pressable>
        ) : null}
        {externalUrl ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(externalUrl)}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <ExternalLink color={colors.gold} size={18} />
            <Text style={styles.linkText}>Consulter la version en ligne</Text>
          </Pressable>
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  updated: {
    color: colors.goldSoft,
    fontFamily: typography.bold,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  paragraph: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bullet: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    height: 5,
    marginTop: 8,
    width: 5,
  },
  bulletText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 21,
  },
  links: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  link: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  linkText: {
    color: colors.goldSoft,
    flex: 1,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});

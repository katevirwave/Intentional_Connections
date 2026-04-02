import { colors, font, radius, space } from '@/lib/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  question: string;
  selected: number | null;
  onSelect: (v: number) => void;
  disabled?: boolean;
};

const labels = ['1', '2', '3', '4', '5'];

export function QuestionCard({ question, selected, onSelect, disabled }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{question}</Text>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleHint}>Never</Text>
        <Text style={styles.scaleHint}>Always</Text>
      </View>
      <View style={styles.row}>
        {labels.map((_, i) => {
          const v = i + 1;
          const active = selected === v;
          return (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => onSelect(v)}
              style={[styles.dot, active && styles.dotActive, disabled && styles.dotDisabled]}
            >
              <Text style={[styles.dotText, active && styles.dotTextActive]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.md,
  },
  prompt: {
    fontSize: font.body,
    lineHeight: 24,
    color: colors.text,
    fontWeight: '500',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleHint: {
    fontSize: font.caption,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  dot: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  dotDisabled: {
    opacity: 0.5,
  },
  dotText: {
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  dotTextActive: {
    color: colors.accent,
  },
});

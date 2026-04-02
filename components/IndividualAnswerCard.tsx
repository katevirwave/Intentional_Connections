import { cardSecondary, colors, font, fontFamily, radius, space } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  question: string;
  answer: string;
  read: boolean;
  onMarkRead: () => void;
};

export function IndividualAnswerCard({ question, answer, read, onMarkRead }: Props) {
  return (
    <View style={styles.card}>
      {!read && <View style={styles.dot} />}
      <Text style={styles.q}>{question}</Text>
      <Text style={styles.a}>{answer}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => {
          hapticLight();
          onMarkRead();
        }}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{read ? 'Marked as read' : 'Mark as read'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...cardSecondary,
    gap: space.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
  },
  q: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textMuted,
  },
  a: {
    fontFamily: fontFamily.body,
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text,
  },
  btn: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentMuted,
  },
  btnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: font.small,
    fontWeight: '600',
    color: colors.accent,
  },
});

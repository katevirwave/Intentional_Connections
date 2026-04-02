import { colors, font, fontFamily, space } from '@/lib/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  right?: ReactNode;
};

export function SectionHeader({ title, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.accentBar} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {right != null ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flex: 1,
  },
  accentBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: font.body,
    fontWeight: '600',
    color: colors.text,
  },
  right: {
    flexShrink: 0,
  },
});

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function hapticLight() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticSelect() {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync();
}

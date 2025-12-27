import { View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

export function ThemedView({ style, backgroundColor, ...otherProps }) {
  const { colors } = useTheme();
  
  const bgColor = backgroundColor || colors.background;

  return <View style={[{ backgroundColor: bgColor }, style]} {...otherProps} />;
}

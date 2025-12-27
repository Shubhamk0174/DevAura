// Fallback for using Ionicons on Android and web.

import Ionicons from '@expo/vector-icons/Ionicons';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-forward',
  'person.fill': 'person',
  'chatbubble.fill': 'chatbubble',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Ionicons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Ionicons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}) {
  return <Ionicons color={color} size={size} name={MAPPING[name]} style={style} />;
}

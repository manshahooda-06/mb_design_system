export { SearchBar } from './SearchBar';
export type { SearchBarProps } from './types';
export type { SearchBarDevice, SearchBarType } from './types';
export { SEARCH_BAR_CONSTANTS } from './constants';
export type { SearchBarVariantProps } from './SearchBar.variants';
// `_Search animating text` is deliberately absent from the package: it is private to
// SearchBar, and its two properties reach the component as `type` and `showAnimatedText`.

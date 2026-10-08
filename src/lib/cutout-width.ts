/** Width painted by object-contain, bounded by its available box. */
export function cutoutWidth(height: number, width: number, aspect: number): number {
  return Math.ceil(Math.min(height * aspect, width));
}

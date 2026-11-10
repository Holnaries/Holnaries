// The Honlaris infinity + star + leaves mark used as an inline icon, so it can
// pick up the surrounding text colour on light and dark surfaces alike.
export default function BrandGlyph({
  size = 20,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`brand-glyph${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

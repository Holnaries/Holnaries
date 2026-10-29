// The Honlaris brand mark (infinity + star + leaves) is always served from
// /uploads; the admin uploads the asset file itself.
// Reused by the public site, service pages, and the admin panel.
export default function BrandMark({
  className = "",
}: {
  className?: string;
}) {
  return (
    <img
      className={`brand-logo${className ? ` ${className}` : ""}`}
      src="/uploads/honlaris-logo.png"
      alt="Honlaris Wellness logo"
      draggable={false}
    />
  );
}

export default function OttoLogo({
  className = "",
  title = "Otto Group"
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`otto-logo ${className}`.trim()}
      src="/otto-group-logo.svg"
      alt={title}
      width={340}
      height={96}
    />
  );
}

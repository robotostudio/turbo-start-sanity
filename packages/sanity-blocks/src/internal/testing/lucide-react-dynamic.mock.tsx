export const DynamicIcon = ({
  name,
  size,
  fallback,
  ...props
}: {
  fallback?: unknown;
  name?: string;
  size?: number;
  [key: string]: unknown;
}) => (
  <span
    data-fallback={fallback ? "true" : undefined}
    data-icon={name}
    data-size={size}
    {...props}
  />
);

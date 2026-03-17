export const DynamicIcon = ({
  name,
  size,
}: {
  name?: string;
  size?: number;
  fallback?: () => React.ReactNode;
  [key: string]: unknown;
}) => <span data-icon={name} data-size={size} />;

export type IconName = string;

export const DynamicIcon = ({
  name,
  size,
}: {
  name?: string;
  size?: number;
  [key: string]: unknown;
}) => <span data-icon={name} data-size={size} />;

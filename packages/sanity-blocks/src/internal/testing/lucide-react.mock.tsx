const IconStub =
  (name: string) =>
  ({ size }: { size?: number }) =>
    <span data-icon={name} data-size={size} />;

export const TriangleAlert = IconStub("triangle-alert");
export const ChevronRight = IconStub("chevron-right");
export const ChevronDown = IconStub("chevron-down");
export const LoaderCircle = IconStub("loader-circle");
export const ArrowUpRight = IconStub("arrow-up-right");
export const Menu = IconStub("menu");
export const X = IconStub("x");
export const ChevronDownIcon = IconStub("chevron-down-icon");

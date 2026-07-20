const IconStub =
  (name: string) =>
  ({ size, ...props }: { size?: number; [key: string]: unknown }) => (
    <span data-icon={name} data-size={size} {...props} />
  );

// Every lucide icon imported anywhere under src/ needs a stub here: a missing
// one resolves to `undefined`, and React then fails the whole render with
// "Element type is invalid". lucide-mock-coverage.test.ts guards this list.
export const ArrowRight = IconStub("arrow-right");
export const ArrowUpRight = IconStub("arrow-up-right");
export const Check = IconStub("check");
export const ChevronDown = IconStub("chevron-down");
export const ChevronDownIcon = IconStub("chevron-down-icon");
export const ChevronRight = IconStub("chevron-right");
export const Copy = IconStub("copy");
export const Facebook = IconStub("facebook");
export const Github = IconStub("github");
export const Instagram = IconStub("instagram");
export const LayoutGrid = IconStub("layout-grid");
export const Linkedin = IconStub("linkedin");
export const LoaderCircle = IconStub("loader-circle");
export const Mail = IconStub("mail");
export const Menu = IconStub("menu");
export const MessageCircle = IconStub("message-circle");
export const PhoneIcon = IconStub("phone-icon");
export const Plus = IconStub("plus");
export const Slack = IconStub("slack");
export const Star = IconStub("star");
export const TextIcon = IconStub("text-icon");
export const TriangleAlert = IconStub("triangle-alert");
export const X = IconStub("x");
export const Youtube = IconStub("youtube");

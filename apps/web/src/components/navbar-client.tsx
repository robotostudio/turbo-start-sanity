"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useIsMobile } from "@/hooks/use-is-mobile";
import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@/lib/sanity/sanity.types";

import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import { SanityButtons } from "./sanity-buttons";
import { SanityIcon } from "./sanity-icon";

// === TYPE DEFINITIONS USING TYPESCRIPT UTILITY TYPES ===

// Extract and refine navbar data types
type NavbarData = NonNullable<QueryNavbarDataResult>;
type NavbarColumns = NonNullable<NavbarData["columns"]>;
type NavbarButtons = NonNullable<NavbarData["buttons"]>;

// Extract specific column types using utility types
type NavbarColumnItem = NavbarColumns[number];
type NavbarLinkColumn = Extract<NavbarColumnItem, { type: "link" }>;
type NavbarDropdownColumn = Extract<NavbarColumnItem, { type: "column" }>;

// Extract link types from dropdown columns
type NavbarDropdownLink = NonNullable<NavbarDropdownColumn["links"]>[number];

// Extract button type
type NavbarButton = NavbarButtons[number];

// Extract settings data types
type SettingsData = NonNullable<QueryGlobalSeoSettingsResult>;
type LogoData = SettingsData["logo"];

// === COMPONENT-SPECIFIC TYPES ===

// Mobile navigation hook types
interface MobileNavigationState {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
  handleToggle: () => void;
}

// Error boundary hook types
interface ErrorBoundaryState {
  hasError: boolean;
  resetError: () => void;
  handleError: (error: Error) => void;
}

// Component props types using Pick and Omit utilities
type MobileNavTriggerProps = {
  onToggle: () => void;
  isOpen: boolean;
};

type NavOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type NavPanelHeaderProps = {
  logo: LogoData | null | undefined;
  siteTitle: string | undefined;
  onClose: () => void;
};

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

type NavSectionProps = {
  title: string | null;
  links: NavbarDropdownLink[];
  onLinkClick: () => void;
};

type NavContentProps = {
  columns: NavbarColumns | null | undefined;
  buttons: NavbarButtons | null | undefined;
  onLinkClick: () => void;
};

type NavPanelProps = {
  isOpen: boolean;
  logo: LogoData | null | undefined;
  siteTitle: string | undefined;
  columns: NavbarColumns | null | undefined;
  buttons: NavbarButtons | null | undefined;
  onClose: () => void;
};

type MobileNavbarProps = {
  navbarData: QueryNavbarDataResult;
  settingsData: QueryGlobalSeoSettingsResult;
};

// Desktop navbar types
type DesktopNavbarProps = Pick<MobileNavbarProps, "navbarData">;

// === CUSTOM HOOKS ===

// Custom hook for mobile navigation state
function useMobileNavigation(): MobileNavigationState {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close navigation when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when nav is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleClose]);

  return {
    isOpen,
    handleOpen,
    handleClose,
    handleToggle,
  };
}

// Error boundary hook
function useErrorBoundary(): ErrorBoundaryState {
  const [hasError, setHasError] = useState(false);

  const resetError = useCallback(() => {
    setHasError(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("Navigation error:", error);
    setHasError(true);
  }, []);

  return {
    hasError,
    resetError,
    handleError,
  };
}

// Mobile navigation trigger button component
function MobileNavTrigger({ onToggle, isOpen }: MobileNavTriggerProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="relative z-50 md:hidden"
      aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={isOpen}
      aria-controls="mobile-navigation"
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

// Navigation overlay component
function NavOverlay({ isOpen, onClose }: NavOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// Navigation panel header
function NavPanelHeader({ logo, siteTitle, onClose }: NavPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>{logo && <Logo alt={siteTitle} priority image={logo} />}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8"
        aria-label="Close navigation"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Single navigation link component
function NavLink({ href, children, onClick, className }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors focus:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
        className,
      )}
    >
      {children}
    </Link>
  );
}

// Navigation section with links
function NavSection({ title, links, onLinkClick }: NavSectionProps) {
  if (!links?.length || !title) return null;

  return (
    <div className="space-y-3">
      <h3
        className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        role="heading"
        aria-level={3}
      >
        {title}
      </h3>
      <div
        className="space-y-1"
        role="group"
        aria-labelledby={`section-${title}`}
      >
        {links.map((link) => (
          <NavLink
            key={link._key}
            href={link.href ?? ""}
            onClick={onLinkClick}
            className="space-x-3"
          >
            <SanityIcon
              icon={link.icon}
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{link.name}</div>
              {link.description && (
                <div className="text-xs text-muted-foreground">
                  {link.description}
                </div>
              )}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

// Navigation content component
function NavContent({ columns, buttons, onLinkClick }: NavContentProps) {
  const { hasError, handleError } = useErrorBoundary();

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-muted-foreground mb-2">Unable to load navigation</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Refresh page
        </Button>
      </div>
    );
  }

  try {
    return (
      <div className="flex flex-col space-y-4">
        {columns?.map((item) => {
          if (item.type === "link") {
            return (
              <NavLink
                key={`mobile-link-${item._key}`}
                href={item.href ?? ""}
                onClick={onLinkClick}
              >
                {item.name}
              </NavLink>
            );
          }

          if (item.type === "column" && item.links) {
            return (
              <NavSection
                key={`mobile-section-${item._key}`}
                title={item.title}
                links={item.links}
                onLinkClick={onLinkClick}
              />
            );
          }

          return null;
        })}

        {buttons && buttons.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <SanityButtons
              buttons={buttons}
              buttonClassName="w-full justify-center"
              className="flex flex-col space-y-2"
            />
          </div>
        )}
      </div>
    );
  } catch (error) {
    handleError(error as Error);
    return null;
  }
}

// Main navigation panel
function NavPanel({
  isOpen,
  logo,
  siteTitle,
  columns,
  buttons,
  onClose,
}: NavPanelProps) {
  return (
    <div
      id="mobile-navigation"
      className={cn(
        "fixed top-0 right-0 h-full w-[300px] bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
      role="navigation"
      aria-label="Mobile navigation"
      aria-hidden={!isOpen}
    >
      <div className="p-4 h-full overflow-y-auto">
        <NavPanelHeader logo={logo} siteTitle={siteTitle} onClose={onClose} />
        <NavContent columns={columns} buttons={buttons} onLinkClick={onClose} />
      </div>
    </div>
  );
}

// Main mobile navigation component
function MobileNavbar({ navbarData, settingsData }: MobileNavbarProps) {
  // Safely extract data with proper null handling
  const siteTitle = settingsData?.siteTitle;
  const logo = settingsData?.logo;
  const columns = navbarData?.columns;
  const buttons = navbarData?.buttons;

  const navigation = useMobileNavigation();
  const { hasError, handleError } = useErrorBoundary();

  if (hasError) {
    return (
      <div className="md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.location.reload()}
          aria-label="Navigation unavailable, click to refresh"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  try {
    return (
      <div className="md:hidden">
        <MobileNavTrigger
          onToggle={navigation.handleToggle}
          isOpen={navigation.isOpen}
        />
        <NavOverlay
          isOpen={navigation.isOpen}
          onClose={navigation.handleClose}
        />
        <NavPanel
          isOpen={navigation.isOpen}
          logo={logo}
          siteTitle={siteTitle}
          columns={columns}
          buttons={buttons}
          onClose={navigation.handleClose}
        />
      </div>
    );
  } catch (error) {
    handleError(error as Error);
    return null;
  }
}

// Old NavbarColumn component removed - using simpler inline approach in DesktopNavbar

export function DesktopNavbar({ navbarData }: DesktopNavbarProps) {
  const { columns, buttons } = navbarData ?? {};

  return (
    <div className="flex items-center justify-between w-full">
      {/* Navigation Links */}
      <nav className="flex items-center space-x-8">
        {columns?.map((column) =>
          column.type === "column" ? (
            <div key={`nav-${column._key}`} className="relative group">
              <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <span>{column.title}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown */}
              <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-popover border rounded-md shadow-lg p-2 min-w-[300px]">
                  <div
                    className={cn(
                      "grid gap-1",
                      column.links && column.links.length > 4
                        ? "grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    {column.links?.map((item) => (
                      <Link
                        key={item._key}
                        href={item.href ?? ""}
                        className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <SanityIcon
                          icon={item.icon}
                          className="h-5 w-5 shrink-0"
                        />
                        <div>
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={`nav-${column._key}`}
              href={column.href ?? ""}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {column.name}
            </Link>
          ),
        )}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center space-x-4">
        <ModeToggle />
        <SanityButtons
          buttons={buttons ?? []}
          className="flex items-center space-x-4"
          buttonClassName="rounded-lg"
        />
      </div>
    </div>
  );
}

function SkeletonMobileNavbar() {
  return (
    <div className="md:hidden">
      <div className="flex justify-end">
        <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden md:grid grid-cols-[1fr_auto] items-center gap-8 w-full">
      <div className="justify-center flex max-w-max flex-1 items-center gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`nav-item-skeleton-${index.toString()}`}
            className="h-12 w-32 rounded bg-muted animate-pulse"
          />
        ))}
      </div>

      <div className="justify-self-end">
        <div className="flex items-center gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`nav-button-skeleton-${index.toString()}`}
              className="h-12 w-32 rounded-[10px] bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NavbarSkeletonResponsive() {
  return (
    <>
      <SkeletonMobileNavbar />
      <SkeletonDesktopNavbar />
    </>
  );
}

export const NavbarClient = ({
  navbarData,
  settingsData,
}: MobileNavbarProps): React.ReactElement | null => {
  const isMobile = useIsMobile();

  // Show skeleton while determining device type
  if (isMobile === undefined) {
    return <NavbarSkeletonResponsive />;
  }

  return (
    <>
      {isMobile ? (
        <MobileNavbar navbarData={navbarData} settingsData={settingsData} />
      ) : (
        <DesktopNavbar navbarData={navbarData} />
      )}
    </>
  );
};

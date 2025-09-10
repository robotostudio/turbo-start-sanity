import { AlertCircle, AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  type: "error" | "warning";
  message: string;
}

interface ErrorStatesProps {
  errors?: string[];
  warnings?: string[];
}

function ErrorState({ type, message }: ErrorStateProps) {
  const isError = type === "error";

  return (
    <div
      className={`
      box-border content-stretch flex gap-3 items-center justify-start p-4 relative rounded-md shrink-0 w-full
      ${isError ? "bg-red-50" : "bg-amber-50"}
    `}
    >
      <div className="relative shrink-0 size-4">
        {isError ? (
          <AlertCircle className="size-full text-red-700" />
        ) : (
          <AlertTriangle className="size-full text-amber-700" />
        )}
      </div>
      <div
        className={`
        basis-0 font-normal grow min-h-px min-w-px relative shrink-0 text-sm leading-8
        ${isError ? "text-red-700" : "text-amber-700"}
      `}
      >
        <p>{message}</p>
      </div>
    </div>
  );
}

export function ErrorStates({ errors = [], warnings = [] }: ErrorStatesProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="contents relative size-full">
      <div className="flex gap-8 w-full">
        {/* Critical errors column */}
        {errors.length > 0 && (
          <div className="content-stretch flex flex-col gap-4 items-start justify-start flex-1 max-w-md">
            <h3 className="font-medium text-lg text-zinc-900 mb-2">
              Critical errors
            </h3>
            {errors.map((error, index) => (
              <ErrorState key={index} type="error" message={error} />
            ))}
          </div>
        )}

        {/* Warning errors column */}
        {warnings.length > 0 && (
          <div className="content-stretch flex flex-col gap-4 items-start justify-start flex-1 max-w-md">
            <h3 className="font-medium text-lg text-zinc-900 mb-2">
              Warning errors
            </h3>
            {warnings.map((warning, index) => (
              <ErrorState key={index} type="warning" message={warning} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Common error messages that can be used
export const SLUG_ERROR_MESSAGES = {
  REQUIRED: "Slug is required.",
  INVALID_CHARACTERS:
    "Only lowercase letters, numbers, and hyphens are allowed.",
  INVALID_START_END: "Slug can't start or end with a hyphen.",
  CONSECUTIVE_HYPHENS: "Use only one hyphen between words.",
  NO_SPACES: "No spaces. Use hyphens instead.",
  NO_UNDERSCORES: "Underscores aren't allowed. Use hyphens instead.",
} as const;

export const SLUG_WARNING_MESSAGES = {
  TOO_SHORT: "Slug must be at least 3 characters long.",
  TOO_LONG: "Slug can't be longer than 60 characters.",
  ALREADY_EXISTS: "This slug is already in use. Try another.",
} as const;

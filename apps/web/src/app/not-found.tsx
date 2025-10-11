import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-400px)] flex-col items-center justify-center gap-4 p-4">
      <h1 className="animate-bounce font-bold text-6xl text-foreground">404</h1>
      <p className="animate-fade-in text-lg text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        aria-label="Return Home"
        className="animate-fade-in-up rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/90"
        href="/"
      >
        Return Home
      </Link>
    </div>
  );
}

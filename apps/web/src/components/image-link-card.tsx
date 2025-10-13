import { cn } from "@workspace/ui/lib/utils";
import Link from "next/link";

import type { PagebuilderType } from "@/types";

import { SanityImage } from "./elements/sanity-image";

type ImageLinkCard = NonNullable<
  NonNullable<PagebuilderType<"imageLinkCards">["cards"]>
>[number];

export type CTACardProps = {
  card: ImageLinkCard;
  className?: string;
};

export function CTACard({ card, className }: CTACardProps) {
  const { image, description, title, href } = card ?? {};
  return (
    <Link
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-3xl p-4 transition-colors md:p-8 xl:h-[400px]",
        className
      )}
      href={href ?? "#"}
    >
      {image?.id && (
        <div className="absolute inset-0 z-[1] mix-blend-multiply">
          <SanityImage
            className="pointer-events-none object-cover opacity-40 grayscale duration-1000 group-hover:opacity-100 group-hover:transition-opacity dark:opacity-60 dark:saturate-200 dark:hover:opacity-[2]"
            height={1080}
            image={image}
            loading="eager"
            width={1920}
          />
        </div>
      )}
      <div className="z-[2] mb-4 flex flex-col space-y-2 pt-64 duration-500 group-hover:top-8 xl:absolute xl:inset-x-8 xl:top-24">
        <h3 className="font-[500] text-[#111827] text-xl dark:text-neutral-300">
          {title}
        </h3>
        <p className="text-[#374151] text-sm transition-opacity delay-150 duration-300 xl:opacity-0 xl:group-hover:opacity-100 dark:text-neutral-300">
          {description}
        </p>
      </div>
    </Link>
  );
}

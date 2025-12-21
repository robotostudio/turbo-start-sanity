import clsx from "clsx";
import type { CSSProperties, ImgHTMLAttributes } from "react";
import { forwardRef } from "react";

export type ViewportImageProps = {
  src?: string;
  alt: string;
  padding?: number;
  backgroundColor?: string;
  center?: boolean;
  wrapperClassName?: string;
  wrapperStyle?: CSSProperties;
  image?: {
    asset: {
      _ref: string;
    }
  };
  imgClassName?: string;
  imgStyle?: CSSProperties;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export const ViewportImage = forwardRef<HTMLImageElement, ViewportImageProps>(
  (
    {
      src,
      alt,
      padding = 64,
      backgroundColor,
      center = true,
      wrapperClassName,
      wrapperStyle,
      image,
      imgClassName,
      imgStyle,
      ...imgProps
    },
    ref
  ) => {

    const containerStyle: CSSProperties = {
      height: "100dvh",
      width: "100vw",
      padding,
      boxSizing: "border-box",
      display: "flex",
      alignItems: center ? "center" : "flex-start",
      justifyContent: center ? "center" : "flex-start",
      backgroundColor,
    };

    const imageStyle: CSSProperties = {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      objectPosition: "center center",
      ...imgStyle,
    };

    return (
      <div
        className={wrapperClassName}
        style={{ ...containerStyle, ...wrapperStyle }}
      >
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={clsx(imgClassName)}
          style={imageStyle}
          {...imgProps}
        />
      </div>
    );
  }
);

ViewportImage.displayName = "ViewportImage";

export default ViewportImage;

"use client";

import Image from "next/image";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
    minWidth: 0,
  },
  logo: {
    display: "block",
    flexShrink: 0,
    // Preserve the official wordmark's intrinsic 140:32 proportions.
    width: "105px",
    height: "auto",
    "@media (max-width: 600px)": {
      width: "84px",
    },
  },
  identity: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: 0,
    paddingInlineStart: tokens.spacingHorizontalL,
    borderInlineStartWidth: tokens.strokeWidthThin,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: tokens.colorNeutralStroke2,
  },
  platform: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase400,
    whiteSpace: "normal",
    overflowWrap: "break-word",
  },
  component: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase200,
  },
});

/** Brand hierarchy: Porto, the observability platform, then this component. */
export function AppBrand() {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Image
        className={styles.logo}
        src="/react-ssr-corp-srep-pop-map/brand/porto.svg"
        alt="Porto"
        width={140}
        height={32}
        unoptimized
        loading="eager"
      />
      <div className={styles.identity}>
        <span className={styles.platform}>Porto Observability Platform</span>
        <span className={styles.component}>Map</span>
      </div>
    </div>
  );
}

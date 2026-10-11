"use client";

import dynamic from "next/dynamic";

/** Client-only boundary: the 3D experience never renders on the server. */
const Experience = dynamic(() => import("./Experience").then((module) => module.Experience), { ssr: false });

export function ExperienceLoader() {
  return <Experience />;
}

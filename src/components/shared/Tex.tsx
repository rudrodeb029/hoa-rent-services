import katex from "katex";
import { useMemo } from "react";

export function Tex({ children, block = false }: { children: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(children, { throwOnError: false, displayMode: block, output: "html" }),
    [children, block]
  );
  return <span className={block ? "block text-center" : ""} dangerouslySetInnerHTML={{ __html: html }} />;
}

"use client";

import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

export function AutoTextarea({
  value,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
  }, [value]);

  return (
    <textarea
      rows={3}
      {...props}
      ref={ref}
      value={value}
      style={{ ...props.style, resize: "none", overflow: "hidden" }}
    />
  );
}

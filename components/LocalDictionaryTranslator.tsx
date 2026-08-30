"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translateExact } from "@/lib/i18n/catalog";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "SVG", "PATH"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

function splitWhitespace(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.slice(leading.length, value.length - trailing.length);
  return { leading, core, trailing };
}

function skip(el: Element | null) {
  if (!el) return true;
  if (SKIP_TAGS.has(el.tagName)) return true;
  return !!el.closest("[data-i18n-skip='true'], code, pre, script, style, svg");
}

export default function LocalDictionaryTranslator() {
  const { lang } = useLanguage();

  useEffect(() => {
    if (!document.body) return;

    const translateText = (node: Text) => {
      if (skip(node.parentElement)) return;
      const raw = node.nodeValue ?? "";
      const { leading, core, trailing } = splitWhitespace(raw);
      if (!core) return;
      const translated = translateExact(core, lang);
      if (translated && translated !== core) node.nodeValue = `${leading}${translated}${trailing}`;
    };

    const translateElement = (el: Element) => {
      if (skip(el)) return;
      for (const attr of ATTRS) {
        const raw = el.getAttribute(attr);
        if (!raw?.trim()) continue;
        const translated = translateExact(raw, lang);
        if (translated && translated !== raw) el.setAttribute(attr, translated);
      }
      // Native select options and button/input values do not always create ordinary text nodes.
      if (el instanceof HTMLOptionElement) {
        const translated = translateExact(el.textContent ?? "", lang);
        if (translated) el.textContent = translated;
      }
      if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type)) {
        const translated = translateExact(el.value, lang);
        if (translated) el.value = translated;
      }
    };

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) translateText(root as Text);
      if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      let n = walker.nextNode();
      while (n) {
        if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
        else translateElement(n as Element);
        n = walker.nextNode();
      }
    };

    walk(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData") translateText(m.target as Text);
        else for (const node of m.addedNodes) walk(node);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.documentElement.lang = lang;
    return () => observer.disconnect();
  }, [lang]);

  return null;
}

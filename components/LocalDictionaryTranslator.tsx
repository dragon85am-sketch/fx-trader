"use client";

import { useEffect } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translateExact } from "@/lib/i18n/catalog";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "SVG", "PATH"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

// Keep the original (source) copy. Without this, after PL -> EN the DOM contains
// English, so EN -> DE/NL/ES may not match a Polish-keyed dictionary until refresh.
const originalText = new WeakMap<Text, string>();
const originalAttrs = new WeakMap<Element, Map<string, string>>();
const originalOptionText = new WeakMap<HTMLOptionElement, string>();
const originalInputValue = new WeakMap<HTMLInputElement, string>();

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
    let applying = false;

    const translateText = (node: Text) => {
      if (skip(node.parentElement)) return;
      if (!originalText.has(node)) originalText.set(node, node.nodeValue ?? "");
      const source = originalText.get(node) ?? "";
      const { leading, core, trailing } = splitWhitespace(source);
      if (!core) return;
      const translated = translateExact(core, lang) ?? core;
      const next = `${leading}${translated}${trailing}`;
      if (node.nodeValue !== next) node.nodeValue = next;
    };

    const translateElement = (el: Element) => {
      if (skip(el)) return;
      let saved = originalAttrs.get(el);
      if (!saved) {
        saved = new Map<string, string>();
        originalAttrs.set(el, saved);
      }
      for (const attr of ATTRS) {
        const current = el.getAttribute(attr);
        if (current == null) continue;
        if (!saved.has(attr)) saved.set(attr, current);
        const source = saved.get(attr) ?? current;
        const translated = translateExact(source, lang) ?? source;
        if (current !== translated) el.setAttribute(attr, translated);
      }

      if (el instanceof HTMLOptionElement) {
        if (!originalOptionText.has(el)) originalOptionText.set(el, el.textContent ?? "");
        const source = originalOptionText.get(el) ?? "";
        const translated = translateExact(source, lang) ?? source;
        if (el.textContent !== translated) el.textContent = translated;
      }

      if (el instanceof HTMLInputElement && ["button", "submit", "reset"].includes(el.type)) {
        if (!originalInputValue.has(el)) originalInputValue.set(el, el.value);
        const source = originalInputValue.get(el) ?? el.value;
        const translated = translateExact(source, lang) ?? source;
        if (el.value !== translated) el.value = translated;
      }
    };

    const walk = (root: Node) => {
      applying = true;
      try {
        if (root.nodeType === Node.TEXT_NODE) translateText(root as Text);
        if (root.nodeType === Node.ELEMENT_NODE) translateElement(root as Element);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        let n = walker.nextNode();
        while (n) {
          if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
          else translateElement(n as Element);
          n = walker.nextNode();
        }
      } finally {
        applying = false;
      }
    };

    walk(document.body);
    const observer = new MutationObserver((mutations) => {
      if (applying) return;
      for (const m of mutations) {
        if (m.type === "characterData") {
          // React may have rendered fresh source copy into an existing node.
          const node = m.target as Text;
          const current = node.nodeValue ?? "";
          const remembered = originalText.get(node);
          if (remembered !== undefined && current !== remembered) {
            // Only replace remembered source when React supplied text that is not
            // the translation currently expected from the remembered source.
            const { leading, core, trailing } = splitWhitespace(remembered);
            const expected = `${leading}${translateExact(core, lang) ?? core}${trailing}`;
            if (current !== expected) originalText.set(node, current);
          }
          translateText(node);
        } else {
          for (const node of m.addedNodes) walk(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.documentElement.lang = lang;
    return () => observer.disconnect();
  }, [lang]);

  return null;
}

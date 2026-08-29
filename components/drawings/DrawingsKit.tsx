"use client";

import React from "react";
import type { UTCTimestamp } from "lightweight-charts";

/* =========================
   TYPES
========================= */
export type Tool = "PAN" | "FIBO" | "RECT" | "CIRCLE" | "HLINE" | "VLINE";

export type DrawBase = {
  id: string;
  name: string;
  createdAt: number;
  visible: boolean;
  color: string; // main
  fill?: string; // optional fill
  width?: number; // line width
  locked?: boolean;
};

export type Pt = { t: UTCTimestamp; p: number };

export type DrawObj =
  | (DrawBase & { type: "HLINE"; p: number })
  | (DrawBase & { type: "VLINE"; t: UTCTimestamp })
  | (DrawBase & { type: "RECT"; a: Pt; b: Pt })
  | (DrawBase & { type: "CIRCLE"; a: Pt; b: Pt })
  | (DrawBase & { type: "FIBO"; a: Pt; b: Pt; levels?: number[] });

export type Template = {
  id: string;
  name: string;
  createdAt: number;
  objects: Omit<DrawObj, "id" | "createdAt">[]; // global template
};

type State = {
  tool: Tool;
  drawings: DrawObj[];
  selectedIds: string[];
  snapToPrice: boolean;
  templates: Template[];
};

type Actions =
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "TOGGLE_SNAP" }
  | { type: "ADD"; obj: DrawObj }
  | { type: "UPSERT"; obj: DrawObj }
  | { type: "REMOVE"; id: string }
  | { type: "CLEAR" }
  | { type: "SELECT_ONE"; id: string; add?: boolean }
  | { type: "SELECT_ONLY"; ids: string[] }
  | { type: "DESELECT_ALL" }
  | { type: "TOGGLE_VISIBLE"; id: string }
  | { type: "SET_COLOR"; id: string; color: string }
  | { type: "RENAME"; id: string; name: string }
  | { type: "FRONT"; id: string }
  | { type: "BACK"; id: string }
  | { type: "SAVE_TEMPLATE"; name: string }
  | { type: "APPLY_TEMPLATE"; templateId: string }
  | { type: "DELETE_TEMPLATE"; templateId: string }
  | { type: "IMPORT_TEMPLATES"; templates: Template[] }
  | { type: "IMPORT_DRAWINGS"; drawings: DrawObj[] };

const LS_KEY = "tv_ultra_drawings_global_v1";
const LS_TPL = "tv_ultra_templates_global_v1";

function uid() {
  return Math.random().toString(36).slice(2, 9) + "-" + Date.now().toString(36);
}

function makeUniqueName(base: string, existing: string[]) {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function reducer(state: State, a: Actions): State {
  switch (a.type) {
    case "SET_TOOL":
      return { ...state, tool: a.tool };

    case "TOGGLE_SNAP":
      return { ...state, snapToPrice: !state.snapToPrice };

    case "ADD": {
      return { ...state, drawings: [a.obj, ...state.drawings] };
    }

    case "UPSERT": {
      const idx = state.drawings.findIndex((d) => d.id === a.obj.id);
      if (idx === -1) return { ...state, drawings: [a.obj, ...state.drawings] };
      const next = [...state.drawings];
      next[idx] = a.obj;
      return { ...state, drawings: next };
    }

    case "REMOVE": {
      return {
        ...state,
        drawings: state.drawings.filter((d) => d.id !== a.id),
        selectedIds: state.selectedIds.filter((x) => x !== a.id),
      };
    }

    case "CLEAR":
      return { ...state, drawings: [], selectedIds: [] };

    case "SELECT_ONE": {
      const id = a.id;
      if (!a.add) return { ...state, selectedIds: [id] };
      const has = state.selectedIds.includes(id);
      return { ...state, selectedIds: has ? state.selectedIds : [...state.selectedIds, id] };
    }

    case "SELECT_ONLY":
      return { ...state, selectedIds: a.ids };

    case "DESELECT_ALL":
      return { ...state, selectedIds: [] };

    case "TOGGLE_VISIBLE":
      return {
        ...state,
        drawings: state.drawings.map((d) => (d.id === a.id ? { ...d, visible: !d.visible } : d)),
      };

    case "SET_COLOR":
      return {
        ...state,
        drawings: state.drawings.map((d) => (d.id === a.id ? { ...d, color: a.color } : d)),
      };

    case "RENAME":
      return {
        ...state,
        drawings: state.drawings.map((d) => (d.id === a.id ? { ...d, name: a.name } : d)),
      };

    case "FRONT": {
      const el = state.drawings.find((d) => d.id === a.id);
      if (!el) return state;
      return { ...state, drawings: [el, ...state.drawings.filter((d) => d.id !== a.id)] };
    }

    case "BACK": {
      const el = state.drawings.find((d) => d.id === a.id);
      if (!el) return state;
      return { ...state, drawings: [...state.drawings.filter((d) => d.id !== a.id), el] };
    }

    case "SAVE_TEMPLATE": {
      const name = a.name?.trim() || "Template";
      const tpl: Template = {
        id: uid(),
        name,
        createdAt: Date.now(),
        objects: state.drawings.map((d) => {
          const { id, createdAt, ...rest } = d;
          return rest;
        }),
      };
      return { ...state, templates: [tpl, ...state.templates] };
    }

    case "APPLY_TEMPLATE": {
      const tpl = state.templates.find((t) => t.id === a.templateId);
      if (!tpl) return state;

      const names = state.drawings.map((d) => d.name);
      const incoming: DrawObj[] = tpl.objects.map((o) => {
        const nm = makeUniqueName(o.name || "Object", names);
        names.push(nm);
        return {
          ...(o as any),
          id: uid(),
          createdAt: Date.now(),
          name: nm,
        } as DrawObj;
      });

      return { ...state, drawings: [...incoming, ...state.drawings] };
    }

    case "DELETE_TEMPLATE":
      return { ...state, templates: state.templates.filter((t) => t.id !== a.templateId) };

    case "IMPORT_TEMPLATES":
      return { ...state, templates: a.templates ?? [] };

    case "IMPORT_DRAWINGS":
      return { ...state, drawings: a.drawings ?? [], selectedIds: [] };

    default:
      return state;
  }
}

/* =========================
   CONTEXT
========================= */
const Ctx = React.createContext<{
  state: State;
  dispatch: React.Dispatch<Actions>;
} | null>(null);

export function DrawingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => {
    const drawings = safeParse<DrawObj[]>(typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null, []);
    const templates = safeParse<Template[]>(typeof window !== "undefined" ? localStorage.getItem(LS_TPL) : null, []);
    const s: State = {
      tool: "PAN",
      drawings,
      selectedIds: [],
      snapToPrice: true,
      templates,
    };
    return s;
  });

  // persist
  React.useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state.drawings));
    } catch {}
  }, [state.drawings]);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_TPL, JSON.stringify(state.templates));
    } catch {}
  }, [state.templates]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useDrawings() {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useDrawings must be used inside DrawingsProvider");
  return v;
}

/* =========================
   ULTRA PANEL (right)
========================= */
export function DrawingsPanel() {
  const { state, dispatch } = useDrawings();
  const selected = state.selectedIds[0];
  const selectedObj = state.drawings.find((d) => d.id === selected);

  const exportTemplates = () => {
    const json = JSON.stringify(state.templates, null, 2);
    navigator.clipboard?.writeText(json).catch(() => {});
    alert("Skopiowano templates JSON do schowka ✅");
  };

  const exportDrawings = () => {
    const json = JSON.stringify(state.drawings, null, 2);
    navigator.clipboard?.writeText(json).catch(() => {});
    alert("Skopiowano drawings JSON do schowka ✅");
  };

  const importTemplates = () => {
    const raw = prompt("Wklej templates JSON:");
    if (!raw) return;
    try {
      const t = JSON.parse(raw) as Template[];
      dispatch({ type: "IMPORT_TEMPLATES", templates: t });
    } catch {
      alert("Błędny JSON");
    }
  };

  const importDrawings = () => {
    const raw = prompt("Wklej drawings JSON:");
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as DrawObj[];
      dispatch({ type: "IMPORT_DRAWINGS", drawings: d });
    } catch {
      alert("Błędny JSON");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B1220] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-extrabold text-white/90">Objects</div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            onClick={() => dispatch({ type: "TOGGLE_SNAP" })}
            type="button"
            title="Magnes do ceny"
          >
            SNAP: {state.snapToPrice ? "ON" : "OFF"}
          </button>

          <button
            className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            onClick={() => {
              const nm = prompt("Template name:", "My template");
              if (!nm) return;
              dispatch({ type: "SAVE_TEMPLATE", name: nm });
            }}
            type="button"
          >
            Save template
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="text-xs font-bold text-white/70 mb-2">Templates (global)</div>

        <div className="flex flex-wrap gap-2 mb-2">
          <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={exportTemplates} type="button">
            Export
          </button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={importTemplates} type="button">
            Import
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-auto pr-1">
          {state.templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="text-xs text-white/85 font-bold truncate">{t.name}</div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
                  onClick={() => dispatch({ type: "APPLY_TEMPLATE", templateId: t.id })}
                  type="button"
                >
                  Add
                </button>
                <button
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-100 hover:bg-red-500/15"
                  onClick={() => dispatch({ type: "DELETE_TEMPLATE", templateId: t.id })}
                  type="button"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
          {!state.templates.length ? <div className="text-xs text-white/40">Brak templates</div> : null}
        </div>
      </div>

      {/* Drawings */}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-white/70">Drawings (global)</div>
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={exportDrawings} type="button">
              Export
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={importDrawings} type="button">
              Import
            </button>
            <button
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-100 hover:bg-red-500/15"
              onClick={() => dispatch({ type: "CLEAR" })}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-2 max-h-[46vh] overflow-auto pr-1">
          {[...state.drawings].sort((a, b) => b.createdAt - a.createdAt).map((d) => {
            const isSel = state.selectedIds.includes(d.id);
            return (
              <div
                key={d.id}
                onClick={(e) => dispatch({ type: "SELECT_ONE", id: d.id, add: (e as any).shiftKey })}
                className={[
                  "cursor-pointer rounded-2xl border px-3 py-2 flex items-center justify-between gap-2 transition",
                  isSel ? "border-sky-400/40 bg-sky-500/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-white/90 truncate">{d.name}</div>
                  <div className="text-[11px] text-white/45">{d.type}</div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={d.color}
                    onChange={(e) => dispatch({ type: "SET_COLOR", id: d.id, color: e.target.value })}
                    className="h-7 w-9 rounded-lg border border-white/10 bg-transparent"
                    title="Kolor"
                    onClick={(e) => e.stopPropagation()}
                  />

                  <button
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/80 hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "TOGGLE_VISIBLE", id: d.id });
                    }}
                    type="button"
                  >
                    {d.visible ? "Hide" : "Show"}
                  </button>

                  <button
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-100 hover:bg-red-500/15"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "REMOVE", id: d.id });
                    }}
                    type="button"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
          {!state.drawings.length ? <div className="text-xs text-white/40">Brak obiektów</div> : null}
        </div>
      </div>

      {/* Selected controls */}
      {selectedObj ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 space-y-2">
          <div className="text-xs font-bold text-white/70">Selected</div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
              onClick={() => {
                const nm = prompt("Rename:", selectedObj.name);
                if (!nm) return;
                dispatch({ type: "RENAME", id: selectedObj.id, name: nm });
              }}
              type="button"
            >
              Rename
            </button>

            <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={() => dispatch({ type: "FRONT", id: selectedObj.id })} type="button">
              FRONT
            </button>
            <button className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10" onClick={() => dispatch({ type: "BACK", id: selectedObj.id })} type="button">
              BACK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   TOOLBAR (top)
========================= */
export function DrawToolbar() {
  const { state, dispatch } = useDrawings();
  const btn = (tool: Tool, label: string) => {
    const on = state.tool === tool;
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: "SET_TOOL", tool })}
        className={[
          "rounded-2xl border px-3 py-2 text-xs font-extrabold transition",
          on ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100" : "border-white/10 bg-white/5 text-zinc-200/70 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        title={label}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {btn("PAN", "PAN")}
      {btn("FIBO", "FIBO")}
      {btn("RECT", "RECT")}
      {btn("CIRCLE", "CIRCLE")}
      {btn("HLINE", "H-LINE")}
      {btn("VLINE", "V-LINE")}
    </div>
  );
}
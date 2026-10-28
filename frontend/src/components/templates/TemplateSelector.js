import React, { useState } from "react";
import { Check, Settings, Palette, Type } from "lucide-react";
import useResumeStore from "../../store/resumeStore";
import {
  TEMPLATES,
  TEMPLATE_COLORS,
  TEMPLATE_CATEGORIES,
  getTemplateById,
} from "./templateData";

const FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Verdana", label: "Verdana" },
  { value: "Roboto", label: "Roboto" },
  { value: "Open Sans", label: "Open Sans" },
  { value: "Lato", label: "Lato" },
  { value: "Poppins", label: "Poppins" },
  { value: "Nunito", label: "Nunito" },
  { value: "DM Sans", label: "DM Sans" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Poppins", label: "Poppins" },
];

const LAYOUTS = [
  { id: "classic", name: "Classic", desc: "Traditional single column" },
  { id: "minimal", name: "Minimal", desc: "Clean, minimal design" },
  { id: "columns", name: "Two Column", desc: "Side by side columns" },
  { id: "sidebar", name: "Sidebar", desc: "Left sidebar layout" },
];

function MiniResumePreview({ primaryColor, accentColor, layout, font }) {
  return (
    <div
      className="w-full h-20 overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ fontFamily: font }}
    >
      <div className="w-full px-2 py-1" style={{ background: primaryColor }}>
        <div
          className="h-1.5 rounded w-2/3 mb-0.5"
          style={{ background: "rgba(255,255,255,0.7)" }}
        />
        <div
          className="h-1 rounded w-1/2"
          style={{ background: "rgba(255,255,255,0.4)" }}
        />
      </div>
      <div className="px-2 py-1.5">
        <div
          className="h-1 rounded mb-0.5"
          style={{ background: accentColor, width: "40%" }}
        />
        <div className="flex gap-1">
          <div
            className="h-1 rounded flex-1"
            style={{ background: "#e2e8f0" }}
          />
          <div
            className="h-1 rounded flex-1"
            style={{ background: "#e2e8f0" }}
          />
          <div
            className="h-1 rounded flex-1"
            style={{ background: "#e2e8f0" }}
          />
        </div>
      </div>
      {layout === "sidebar" && (
        <div
          className="absolute right-0 top-8 bottom-8 w-8 rounded-l"
          style={{ background: primaryColor, opacity: 0.3 }}
        />
      )}
    </div>
  );
}

export default function TemplateSelector({ onClose }) {
  const { selectedTemplate, setTemplate, selectedTemplateMeta } =
    useResumeStore();
  const current = getTemplateById(selectedTemplate);

  const [activeTab, setActiveTab] = useState("templates"); // templates | custom
  const [selectedCategory, setSelectedCategory] = useState(
    current?.category || "General",
  );
  const [selectedLayout, setSelectedLayout] = useState(selectedTemplate);
  const [selectedColors, setSelectedColors] = useState(
    selectedTemplateMeta || { primaryColor: "#1e3a5f", accentColor: "#3b82f6" },
  );
  const [selectedFont, setSelectedFont] = useState(current?.font || "Inter");
  const [selectedLayoutStyle, setSelectedLayoutStyle] = useState(
    current?.layout || "classic",
  );

  // Custom tab state
  const [customPrimary, setCustomPrimary] = useState(
    selectedColors.primaryColor || "#1e3a5f",
  );
  const [customAccent, setCustomAccent] = useState(
    selectedColors.accentColor || "#3b82f6",
  );

  const categoryTemplates = TEMPLATES.filter(
    (t) => t.category === selectedCategory,
  );

  const handleApply = () => {
    const template =
      activeTab === "custom"
        ? {
            id: "custom",
            name: "Custom",
            category: "Custom",
            font: selectedFont,
            layout: selectedLayoutStyle,
          }
        : getTemplateById(selectedLayout);

    // Normalize: selectedColors uses {primary, accent}, customColors are direct strings
    const primaryColor =
      activeTab === "custom"
        ? customPrimary
        : selectedColors.primary ||
          selectedColors.primaryColor ||
          template.defaultPrimary ||
          "#1e3a5f";
    const accentColor =
      activeTab === "custom"
        ? customAccent
        : selectedColors.accent ||
          selectedColors.accentColor ||
          template.defaultAccent ||
          "#3b82f6";

    setTemplate({
      id: activeTab === "custom" ? "custom" : template.id,
      ...template,
      primaryColor,
      accentColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Choose Template
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                  activeTab === "templates"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500"
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                  activeTab === "custom"
                    ? "bg-white shadow text-slate-900"
                    : "text-slate-500"
                }`}
              >
                <Settings size={14} /> Custom
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xl"
          >
            ×
          </button>
        </div>

        {activeTab === "templates" ? (
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
            {/* Categories Sidebar */}
            <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-slate-200 p-2 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-500 px-2 py-1">
                INDUSTRIES
              </div>
              <div className="space-y-0.5">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm font-medium transition ${
                      selectedCategory === cat
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {categoryTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedLayout(t.id);
                      setSelectedColors({
                        primary: TEMPLATE_COLORS[0].primary,
                        accent: TEMPLATE_COLORS[0].accent,
                      });
                    }}
                    className={`p-2 rounded-xl border-2 transition-all text-left ${
                      selectedLayout === t.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <MiniResumePreview
                      primaryColor={
                        selectedColors.primaryColor || selectedColors.primary
                      }
                      accentColor={
                        selectedColors.accentColor || selectedColors.accent
                      }
                      layout={t.layout}
                      font={t.font}
                    />
                    <div className="mt-1.5 font-medium text-xs text-slate-900 truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {t.layout}
                    </div>
                  </button>
                ))}
              </div>

              {/* Colors */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Palette size={12} /> COLOR THEME
                </h3>
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
                  {TEMPLATE_COLORS.slice(0, 14).map((color, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setSelectedColors({
                          primary: color.primary,
                          accent: color.accent,
                          primaryColor: color.primary,
                          accentColor: color.accent,
                        })
                      }
                      className={`p-1.5 rounded-lg border-2 transition-all ${
                        selectedColors.primary === color.primary
                          ? "border-brand-600"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      title={color.name}
                    >
                      <div
                        className="h-4 rounded mb-1"
                        style={{ background: color.primary }}
                      />
                      <div
                        className="h-1.5 rounded"
                        style={{ background: color.accent }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Custom Tab */
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Preview */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2">
                PREVIEW
              </h3>
              <div className="max-w-xs mx-auto">
                <MiniResumePreview
                  primaryColor={customPrimary}
                  accentColor={customAccent}
                  layout={selectedLayoutStyle}
                  font={selectedFont}
                />
              </div>
            </div>

            {/* Layout */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <Settings size={12} /> LAYOUT STYLE
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {LAYOUTS.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayoutStyle(layout.id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedLayoutStyle === layout.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-900">
                      {layout.name}
                    </div>
                    <div className="text-xs text-slate-500">{layout.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <Type size={12} /> FONT FAMILY
              </h3>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-brand-500"
              >
                {FONTS.map((font) => (
                  <option
                    key={font.value}
                    value={font.value}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Colors */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-slate-500 mb-2">
                CUSTOM COLORS
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => setCustomPrimary(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-600 mb-1 block">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customAccent}
                      onChange={(e) => setCustomAccent(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-slate-200 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Colors */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">
                QUICK COLORS
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {TEMPLATE_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCustomPrimary(color.primary);
                      setCustomAccent(color.accent);
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition-all"
                    title={color.name}
                  >
                    <div
                      className="h-3 rounded mb-0.5"
                      style={{ background: color.primary }}
                    />
                    <div
                      className="h-2 rounded"
                      style={{ background: color.accent }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {activeTab === "templates"
              ? `${TEMPLATES.length} ATS-optimized templates`
              : "Fully customizable"}
          </span>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 transition-colors flex items-center gap-1"
          >
            <Check size={16} /> Apply Template
          </button>
        </div>
      </div>
    </div>
  );
}

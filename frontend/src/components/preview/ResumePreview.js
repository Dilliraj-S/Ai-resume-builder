import React, {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { flushSync } from "react-dom";
import useResumeStore from "../../store/resumeStore";
import { getTemplateById, getBuilderLayout } from "../templates/templateData";
import "./ResumePreview.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isLightColor(hex) {
  if (!hex) return false;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150;
}

function getHeaderTextColor(primaryColor) {
  return isLightColor(primaryColor) ? "#111" : "white";
}

function formatBullets(text) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length > 1 || text.includes("*")) {
    return (
      <ul className="preview-bullets">
        {lines.map((l, i) => (
          <li key={i}>{l.replace(/^[*\-]\s*/, "")}</li>
        ))}
      </ul>
    );
  }
  return <p>{text}</p>;
}

function splitTextChunks(text, maxLen = 120) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > maxLen) {
      if (cur) chunks.push(cur.trim());
      cur = w;
    } else {
      cur = `${cur} ${w}`.trim();
    }
  });
  if (cur) chunks.push(cur.trim());
  const merged = [];
  chunks.forEach((c) => {
    if (c.split(/\s+/).length <= 2 && merged.length > 0)
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${c}`.trim();
    else merged.push(c);
  });
  return merged;
}

function extractBullets(text) {
  if (!text) return [];
  const rawLines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const merge = (lines) => {
    const out = [];
    lines.forEach((line) => {
      if (!out.length) {
        out.push(line);
        return;
      }
      const prev = out[out.length - 1];
      const startsLow = /^[a-z]/.test(line);
      const startsPun = /^[,.;:)]/.test(line);
      const prevSoft = /(\b(and|or|with|for|to|of|using)\b|,)\s*$/i.test(prev);
      const short = line.split(/\s+/).length <= 4;
      if (startsLow || startsPun || prevSoft || short)
        out[out.length - 1] = `${prev} ${line}`.replace(/\s+/g, " ").trim();
      else out.push(line);
    });
    return out;
  };
  const lines = merge(rawLines);
  if (lines.length > 1 || text.includes("*"))
    return lines.map((l) => l.replace(/^[*\-]\s*/, "").trim()).filter(Boolean);
  return [text.trim()];
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function paginate(items, heights, limit) {
  if (!items.length) return [];
  const pages = [];
  let page = [],
    h = 0;
  items.forEach((item, i) => {
    const ih = heights[i] || 0;
    if (h + ih > limit && page.length) {
      pages.push(page);
      page = [item];
      h = ih;
    } else {
      page.push(item);
      h += ih;
    }
  });
  if (page.length) pages.push(page);
  return pages;
}

function paginateFirstOther(items, heights, firstLimit, otherLimit) {
  if (!items.length) return [];
  const pages = [];
  let page = [],
    h = 0,
    limit = firstLimit;
  items.forEach((item, i) => {
    const ih = heights[i] || 0;
    if (h + ih > limit && page.length) {
      pages.push(page);
      page = [item];
      h = ih;
      limit = otherLimit;
    } else {
      page.push(item);
      h += ih;
    }
  });
  if (page.length) pages.push(page);
  return pages;
}

function readHeights(ref) {
  if (!ref?.current) return [];
  return Array.from(ref.current.querySelectorAll(":scope > .m-item")).map(
    (n) => n.offsetHeight || 0,
  );
}

// ─── readAllEdits ──────────────────────────────────────────────────────────────
function readAllEditsFromDOM(previewEl, store) {
  if (!previewEl) return;

  const qAll = (sel) => {
    const all = Array.from(previewEl.querySelectorAll(sel));
    return all.filter((el) => !el.closest('[data-measure="true"]'));
  };
  const q = (sel) => qAll(sel)[0] || null;

  const nameEl = q(".tpl-name[contenteditable]");
  if (nameEl)
    store.updateBasicInfo({
      fullName: nameEl.innerText.replace(/\r/g, "").trimEnd(),
    });

  const sumEl = q("[data-summary-chunk]");
  if (sumEl) store.setSummary(sumEl.innerText.trim());

  qAll(".tpl-section-title[contenteditable]").forEach((el) => {
    const key = el.getAttribute("data-heading-key");
    if (key) store.setCustomHeading(key, el.innerText.trim());
  });

  const expIds = new Set();
  qAll("[data-exp-chunk]").forEach((el) =>
    expIds.add(el.getAttribute("data-id")),
  );
  expIds.forEach((id) => {
    const titleEl = q(`.tpl-job-title[contenteditable][data-exp-id="${id}"]`);
    if (titleEl)
      store.updateExperience(id, { jobTitle: titleEl.innerText.trim() });
    const grouped = [];
    qAll(`[data-exp-chunk][data-id="${id}"]`).forEach((n) => {
      const text = n.innerText.trim();
      if (!text) return;
      const bi = Number(n.getAttribute("data-bullet"));
      grouped[bi] = grouped[bi] ? `${grouped[bi]} ${text}` : text;
    });
    if (grouped.length)
      store.updateExperience(id, {
        description: grouped
          .filter(Boolean)
          .map((l) => `* ${l}`)
          .join("\n"),
      });
  });

  const internIds = new Set();
  qAll("[data-intern-chunk]").forEach((el) =>
    internIds.add(el.getAttribute("data-id")),
  );
  internIds.forEach((id) => {
    const titleEl = q(
      `.tpl-job-title[contenteditable][data-intern-id="${id}"]`,
    );
    if (titleEl) store.updateInternship(id, { role: titleEl.innerText.trim() });
    const grouped = [];
    qAll(`[data-intern-chunk][data-id="${id}"]`).forEach((n) => {
      const text = n.innerText.trim();
      if (!text) return;
      const bi = Number(n.getAttribute("data-bullet"));
      grouped[bi] = grouped[bi] ? `${grouped[bi]} ${text}` : text;
    });
    if (grouped.length)
      store.updateInternship(id, {
        description: grouped
          .filter(Boolean)
          .map((l) => `* ${l}`)
          .join("\n"),
      });
  });

  const projIds = new Set();
  qAll("[data-proj-chunk]").forEach((el) =>
    projIds.add(el.getAttribute("data-id")),
  );
  projIds.forEach((id) => {
    const titleEl = q(`.tpl-job-title[contenteditable][data-proj-id="${id}"]`);
    if (titleEl) store.updateProject(id, { title: titleEl.innerText.trim() });
    const grouped = [];
    qAll(`[data-proj-chunk][data-id="${id}"]`).forEach((n) => {
      const text = n.innerText.trim();
      if (!text) return;
      const bi = Number(n.getAttribute("data-bullet"));
      grouped[bi] = grouped[bi] ? `${grouped[bi]} ${text}` : text;
    });
    if (grouped.length)
      store.updateProject(id, {
        description: grouped
          .filter(Boolean)
          .map((l) => `* ${l}`)
          .join("\n"),
      });
  });

  qAll(".tpl-job-title[contenteditable][data-edu-id]").forEach((el) => {
    const id = el.getAttribute("data-edu-id");
    if (id) store.updateEducation(id, { college: el.innerText.trim() });
  });

  qAll("[data-skill-cat]").forEach((el) => {
    const cat = el.getAttribute("data-skill-cat");
    const valEl = q(`[data-skill-vals="${cat}"]`);
    const newCat = el.innerText.replace(":", "").trim();
    const vals = valEl
      ? valEl.innerText
          .split("|")
          .map((v) => v.trim())
          .filter(Boolean)
      : null;
    const s = useResumeStore.getState();
    if (newCat !== cat) {
      s.updateSkillCategory(newCat, vals || []);
      s.updateSkillCategory(cat, []);
    } else if (vals) {
      s.updateSkillCategory(cat, vals);
    }
  });

  qAll("[data-cert-id]").forEach((el) => {
    const id = el.getAttribute("data-cert-id");
    const field = el.getAttribute("data-cert-field");
    if (!id || !field) return;
    let val = el.innerText.trim();
    if (field === "organization") val = val.replace(/^·\s*/, "");
    if (field === "year") val = val.replace(/[()]/g, "");
    useResumeStore.getState().updateCertification(id, { [field]: val });
  });

  qAll("[data-ach-id]").forEach((el) => {
    const id = el.getAttribute("data-ach-id");
    if (id) store.updateAchievement(id, el.innerText.trim());
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ sectionKey, isEditing, onCommit, currentValue }) {
  return (
    <>
      <h2
        className={`tpl-section-title${isEditing ? " preview-editable" : ""}`}
        contentEditable={isEditing ? "true" : undefined}
        suppressContentEditableWarning
        data-heading-key={isEditing ? sectionKey : undefined}
        onBlur={
          isEditing
            ? (e) => onCommit(e.currentTarget.innerText.trim())
            : undefined
        }
      >
        {currentValue}
      </h2>
      <div className="tpl-divider" />
    </>
  );
}

const formatUrl = (url) => {
  if (!url) return null;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://")
    ? t
    : "https://" + t;
};
const getLinkedinUrl = (u) => {
  if (!u) return null;
  const t = u.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (t.startsWith("linkedin.com") || t.startsWith("www.linkedin.com"))
    return "https://" + t;
  return "https://linkedin.com/in/" + t;
};
const getGithubUrl = (u) => {
  if (!u) return null;
  const t = u.trim();
  return t.startsWith("http://") || t.startsWith("https://")
    ? t
    : "https://github.com/" + t;
};

function ResumeHeader({ cls, info, isEditing, textColor }) {
  return (
    <header className={`tpl-header${cls}`} style={{ color: textColor }}>
      <h1
        className={`tpl-name${isEditing ? " preview-editable" : ""}`}
        contentEditable={isEditing ? "true" : undefined}
        suppressContentEditableWarning
        style={{ whiteSpace: "pre-wrap" }}
      >
        {info.fullName || "Your Name"}
      </h1>
      <div className="tpl-contact">
        {info.email && (
          <a href={`mailto:${info.email}`} className="tpl-contact-link">
            ✉ {info.email}
          </a>
        )}
        {info.phone && (
          <a
            href={`tel:${info.phone.replace(/\D/g, "")}`}
            className="tpl-contact-link"
          >
            📞 {info.phone}
          </a>
        )}
        {info.linkedin && (
          <a
            href={getLinkedinUrl(info.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="tpl-contact-link"
          >
            🔗 {info.linkedin}
          </a>
        )}
        {info.github && (
          <a
            href={getGithubUrl(info.github)}
            target="_blank"
            rel="noopener noreferrer"
            className="tpl-contact-link"
          >
            🐙 {info.github}
          </a>
        )}
        {info.portfolio && (
          <a
            href={formatUrl(info.portfolio)}
            target="_blank"
            rel="noopener noreferrer"
            className="tpl-contact-link"
          >
            🌐 {info.portfolio}
          </a>
        )}
      </div>
    </header>
  );
}

function SummaryField({ text, isEditing }) {
  return (
    <p
      className={`tpl-summary${isEditing ? " preview-editable" : ""}`}
      contentEditable={isEditing ? "true" : undefined}
      suppressContentEditableWarning
      data-summary-chunk={isEditing ? "0" : undefined}
      style={{ whiteSpace: "pre-wrap" }}
    >
      {text}
    </p>
  );
}

function EditableField({
  tag: Tag = "span",
  className,
  style,
  isEditing,
  onKeyDown,
  children,
  cont,
  dataExpId,
  dataInternId,
  dataProjId,
  dataEduId,
  dataExpChunk,
  dataInternChunk,
  dataProjChunk,
  dataBullet,
  dataId,
  dataSkillCat,
  dataSkillVals,
  dataCertId,
  dataCertField,
  dataAchId,
}) {
  if (!isEditing) {
    return (
      <Tag
        className={`${className || ""}${cont ? " bullet-cont" : ""}`}
        style={style}
      >
        {children}
      </Tag>
    );
  }
  const attrs = {};
  if (dataExpId != null) attrs["data-exp-id"] = String(dataExpId);
  if (dataInternId != null) attrs["data-intern-id"] = String(dataInternId);
  if (dataProjId != null) attrs["data-proj-id"] = String(dataProjId);
  if (dataEduId != null) attrs["data-edu-id"] = String(dataEduId);
  if (dataExpChunk != null) attrs["data-exp-chunk"] = String(dataExpChunk);
  if (dataInternChunk != null)
    attrs["data-intern-chunk"] = String(dataInternChunk);
  if (dataProjChunk != null) attrs["data-proj-chunk"] = String(dataProjChunk);
  if (dataBullet != null) attrs["data-bullet"] = String(dataBullet);
  if (dataId != null) attrs["data-id"] = String(dataId);
  if (dataSkillCat != null) attrs["data-skill-cat"] = String(dataSkillCat);
  if (dataSkillVals != null) attrs["data-skill-vals"] = String(dataSkillVals);
  if (dataCertId != null) attrs["data-cert-id"] = String(dataCertId);
  if (dataCertField != null) attrs["data-cert-field"] = String(dataCertField);
  if (dataAchId != null) attrs["data-ach-id"] = String(dataAchId);
  return (
    <Tag
      className={`${className || ""} preview-editable${cont ? " bullet-cont" : ""}`}
      style={style}
      contentEditable={isEditing ? "true" : undefined}
      suppressContentEditableWarning
      onKeyDown={onKeyDown}
      {...attrs}
    >
      {children}
    </Tag>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ResumePreview({ fontSize = 11, fontFamily = "Inter" }) {
  const store = useResumeStore();
  const {
    resumeData,
    selectedTemplate,
    selectedTemplateMeta,
    updateBasicInfo,
    setSummary,
    updateExperience,
    removeExperience,
    updateInternship,
    removeInternship,
    updateProject,
    removeProject,
    updateAchievement,
    removeAchievement,
    removeCertification,
    removeEducation,
    setCustomHeading,
  } = store;

  // Merge in this order (highest priority last wins):
  // 1. Template defaults (defaultPrimary, defaultAccent from templateData)
  // 2. User-selected colors stored in selectedTemplateMeta (primaryColor, accentColor)
  const _templateBase = getTemplateById(selectedTemplate);
  const _meta = selectedTemplateMeta || {};
  const template = {
    ..._templateBase,
    primaryColor:
      _meta.primaryColor ||
      _meta.primary ||
      _templateBase.defaultPrimary ||
      "#1e3a5f",
    accentColor:
      _meta.accentColor ||
      _meta.accent ||
      _templateBase.defaultAccent ||
      "#3b82f6",
    font: _meta.font || _templateBase.font || "Inter",
    layout: _meta.layout || _templateBase.layout || "classic",
    name: _templateBase.name,
  };

  const mFlowRef = useRef(null);
  const mTopRef = useRef(null);
  const mLeftRef = useRef(null);
  const mRightRef = useRef(null);
  const mSideRef = useRef(null);
  const previewRef = useRef(null);
  const wrapperRef = useRef(null);
  const lastSigRef = useRef("");

  const [flowPages, setFlowPages] = useState([]);
  const [colPages, setColPages] = useState({ left: [], right: [], top: [] });
  const [sidePages, setSidePages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [, forceUpdate] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [prevPageCount, setPrevPageCount] = useState(0);
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    let timer = null;
    const unsub = useResumeStore.subscribe(() => {
      if (useResumeStore.getState()._editingPreview) return;
      clearTimeout(timer);
      timer = setTimeout(() => setStoreVersion((v) => v + 1), 60);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // ── Width-first scale ────────────────────────────────────────────────────────
  // Fill the panel WIDTH and let the container scroll vertically.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let rafId = null;

    const update = () => {
      const panel =
        wrapper.closest(".builder-preview-panel") || wrapper.parentElement;
      if (!panel) return;

      requestAnimationFrame(() => {
        const label = wrapper.querySelector(".preview-label");
        const labelH = label ? label.offsetHeight + 12 : 0;
        const panelW = panel.clientWidth;
        const panelH = panel.clientHeight;
        const hPad = 16;
        const vPad = labelH + 24;
        const scaleByW = (panelW - hPad) / 794;
        const scaleByH = (panelH - vPad) / 1123;
        const s = Math.min(1, scaleByH < 0.26 ? scaleByH : scaleByW);
        wrapper.style.setProperty(
          "--preview-scale",
          Math.max(0.15, s).toFixed(4),
        );
      });
    };
    update();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    });
    ro.observe(wrapper);
    const panel =
      wrapper.closest(".builder-preview-panel") || wrapper.parentElement;
    if (panel) ro.observe(panel);

    // Force update scale when isEditing changes
    const timeoutId = setTimeout(update, 0);

    return () => {
      clearTimeout(timeoutId);
      ro.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [isEditing]);

  const {
    basicInfo: info = {},
    summary = "",
    experience = [],
    internships = [],
    education = [],
    projects = [],
    skills = {},
    certifications = [],
    achievements = [],
    customHeadings = {},
  } = resumeData;

  const hasExp = experience.length > 0;
  const hasIntern = internships.length > 0;
  const allSkills = Object.values(skills).flat();

  const layoutMap = {
    Minimal: "minimal",
    Professional: "columns",
    Executive: "sidebar",
    Technical: "columns",
    Creative: "sidebar",
    Fresher: "classic",
    MBA: "columns",
    Finance: "minimal",
    Medical: "classic",
    Legal: "classic",
    Engineering: "columns",
    Education: "classic",
    Government: "classic",
    Hospitality: "sidebar",
    Sales: "columns",
    HR: "classic",
    Operations: "columns",
    Media: "sidebar",
    Academic: "classic",
  };
  const layout = getBuilderLayout(template.layout) || template.layout || "classic";
  const tplStyle = {
    "--tpl-primary": template.primaryColor,
    "--tpl-accent": template.accentColor,
    "--tpl-font": template.font,
    "--tpl-font-size": `${fontSize}px`,
    "--tpl-font-family": fontFamily,
  };

  const totalPages = useMemo(() => {
    if (layout === "classic" || layout === "minimal")
      return flowPages.length > 0 ? flowPages.length : 1;
    if (layout === "columns")
      return Math.max(
        1,
        Math.max(colPages.left.length, colPages.right.length, 1),
      );
    if (layout === "sidebar")
      return sidePages.length > 0 ? sidePages.length : 1;
    return 1;
  }, [layout, flowPages, colPages, sidePages]);

  const onBackspace = useCallback(
    (e, type, id) => {
      if (e.key !== "Backspace") return;
      const content = e.currentTarget.innerText.replace(/\n/g, "").trim();
      const sel = window.getSelection();
      const atStart = sel && sel.anchorOffset === 0 && sel.focusOffset === 0;
      if (content === "" || atStart) {
        e.preventDefault();
        switch (type) {
          case "experience":
            removeExperience(id);
            break;
          case "internship":
            removeInternship(id);
            break;
          case "project":
            removeProject(id);
            break;
          case "achievement":
            removeAchievement(id);
            break;
          case "certification":
            removeCertification(id);
            break;
          case "education":
            removeEducation(id);
            break;
          default:
            break;
        }
      }
    },
    [
      removeExperience,
      removeInternship,
      removeProject,
      removeAchievement,
      removeCertification,
      removeEducation,
    ],
  );

  const getH = (key, fb) => customHeadings?.[key] || fb;
  const secHead = (key, fb) => (
    <SectionHeading
      key={`sh-${key}`}
      sectionKey={key}
      isEditing={isEditing}
      onCommit={(val) => setCustomHeading(key, val)}
      currentValue={getH(key, fb)}
    />
  );

  // ── Headers ────────────────────────────────────────────────────────────────
  const headerTextColor = getHeaderTextColor(template.primaryColor);
  const headerClassic = useMemo(
    () => (
      <ResumeHeader
        cls=""
        info={info}
        isEditing={isEditing}
        textColor={headerTextColor}
      />
    ),
    [info, isEditing, headerTextColor],
  );
  const headerCompact = useMemo(
    () => (
      <ResumeHeader
        cls=" tpl-header--compact"
        info={info}
        isEditing={isEditing}
        textColor={headerTextColor}
      />
    ),
    [info, isEditing, headerTextColor],
  );
  const headerMinimal = useMemo(
    () => (
      <ResumeHeader
        cls=" tpl-header--minimal"
        info={info}
        isEditing={isEditing}
        textColor={headerTextColor}
      />
    ),
    [info, isEditing, headerTextColor],
  );

  // ── Summary ────────────────────────────────────────────────────────────────
  const summaryBlocks = useMemo(() => {
    const norm = summary?.replace(/\s*\n+\s*/g, " ").trim();
    if (!norm) return [];
    return [
      <section className="tpl-section tpl-summary-block" key="sum">
        {secHead("summary", "Professional Summary")}
        <SummaryField text={norm} isEditing={isEditing} />
      </section>,
    ];
  }, [summary, isEditing, customHeadings]);

  // ── Experience ─────────────────────────────────────────────────────────────
  const experienceBlocks = useMemo(() => {
    if (!hasExp) return [];
    return experience.map((exp, idx) => {
      const bullets = extractBullets(exp.description);
      const chunkItems = bullets.flatMap((b) =>
        splitTextChunks(b, 110).map((c, ci) => ({ text: c, cont: ci > 0 })),
      );
      return (
        <section className="tpl-section" key={`exp-${exp.id}`}>
          {idx === 0 && secHead("experience", "Work Experience")}
          <div className="tpl-entry">
            <div className="tpl-entry-header">
              <div>
                <EditableField
                  tag="strong"
                  className="tpl-job-title"
                  isEditing={isEditing}
                  dataExpId={isEditing ? exp.id : undefined}
                  onKeyDown={(e) =>
                    isEditing && onBackspace(e, "experience", exp.id)
                  }
                >
                  {exp.jobTitle || "Job Title"}
                </EditableField>
                {exp.company && (
                  <span className="tpl-company"> · {exp.company}</span>
                )}
              </div>
              <span className="tpl-date">
                {exp.startDate} –{" "}
                {exp.currentlyWorking ? "Present" : exp.endDate}
              </span>
            </div>
            {isEditing ? (
              <ul className="preview-bullets">
                {bullets.map((b, bi) =>
                  splitTextChunks(b, 110).map((c, ci) => (
                    <EditableField
                      key={`${exp.id}-${bi}-${ci}`}
                      tag="li"
                      cont={ci > 0}
                      isEditing={isEditing}
                      dataExpChunk={ci}
                      dataBullet={bi}
                      dataId={exp.id}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !e.currentTarget.innerText.trim()
                        ) {
                          e.preventDefault();
                          removeExperience(exp.id);
                        }
                      }}
                    >
                      {c}
                    </EditableField>
                  )),
                )}
              </ul>
            ) : chunkItems.length > 0 ? (
              <ul className="preview-bullets">
                {chunkItems.map((item, i) => (
                  <li key={i} className={item.cont ? "bullet-cont" : ""}>
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="tpl-desc">{formatBullets(exp.description)}</div>
            )}
          </div>
        </section>
      );
    });
  }, [hasExp, experience, isEditing, customHeadings]);

  // ── Internships ────────────────────────────────────────────────────────────
  const internshipBlocks = useMemo(() => {
    if (!hasIntern) return [];
    return internships.map((intern, idx) => {
      const bullets = extractBullets(intern.description);
      const chunkItems = bullets.flatMap((b) =>
        splitTextChunks(b, 110).map((c, ci) => ({ text: c, cont: ci > 0 })),
      );
      return (
        <section className="tpl-section" key={`intern-${intern.id}`}>
          {idx === 0 && secHead("internships", "Internship Experience")}
          <div className="tpl-entry">
            <div className="tpl-entry-header">
              <div>
                <EditableField
                  tag="strong"
                  className="tpl-job-title"
                  isEditing={isEditing}
                  dataInternId={isEditing ? intern.id : undefined}
                  onKeyDown={(e) =>
                    isEditing && onBackspace(e, "internship", intern.id)
                  }
                >
                  {intern.role || "Role"}
                </EditableField>
                {intern.company && (
                  <span className="tpl-company"> · {intern.company}</span>
                )}
              </div>
              <span className="tpl-date">
                {intern.startDate} –{" "}
                {intern.currentlyWorking ? "Present" : intern.endDate}
              </span>
            </div>
            {isEditing ? (
              <ul className="preview-bullets">
                {bullets.map((b, bi) =>
                  splitTextChunks(b, 110).map((c, ci) => (
                    <EditableField
                      key={`${intern.id}-${bi}-${ci}`}
                      tag="li"
                      cont={ci > 0}
                      isEditing={isEditing}
                      dataInternChunk={ci}
                      dataBullet={bi}
                      dataId={intern.id}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          !e.currentTarget.innerText.trim()
                        ) {
                          e.preventDefault();
                          removeInternship(intern.id);
                        }
                      }}
                    >
                      {c}
                    </EditableField>
                  )),
                )}
              </ul>
            ) : chunkItems.length > 0 ? (
              <ul className="preview-bullets">
                {chunkItems.map((item, i) => (
                  <li key={i} className={item.cont ? "bullet-cont" : ""}>
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="tpl-desc">
                {formatBullets(intern.description)}
              </div>
            )}
          </div>
        </section>
      );
    });
  }, [hasIntern, internships, isEditing, customHeadings]);

  // ── Education ──────────────────────────────────────────────────────────────
  const educationBlocks = useMemo(
    () =>
      education.map((edu, idx) => (
        <section className="tpl-section" key={`edu-${edu.id}`}>
          {idx === 0 && secHead("education", "Education")}
          <div className="tpl-entry">
            <div className="tpl-entry-header">
              <div>
                <EditableField
                  tag="strong"
                  className="tpl-job-title"
                  isEditing={isEditing}
                  dataEduId={isEditing ? edu.id : undefined}
                  onKeyDown={(e) =>
                    isEditing && onBackspace(e, "education", edu.id)
                  }
                >
                  {edu.institution}
                </EditableField>
                {edu.degree && (
                  <span className="tpl-company"> · {edu.degree}</span>
                )}
              </div>
              <div className="tpl-edu-meta">
                {(edu.startDate || edu.endDate) && (
                  <span className="tpl-date">
                    {edu.startDate && edu.endDate
                      ? `${edu.startDate} – ${edu.endDate}`
                      : edu.startDate || edu.endDate}
                  </span>
                )}
                {edu.cgpa && <span className="tpl-cgpa">CGPA: {edu.cgpa}</span>}
              </div>
            </div>
          </div>
        </section>
      )),
    [education, isEditing, customHeadings],
  );

  // ── Projects ───────────────────────────────────────────────────────────────
  const projectBlocks = useMemo(
    () =>
      projects.map((p, idx) => {
        const bullets = extractBullets(p.description);
        const chunkItems = bullets.flatMap((b) =>
          splitTextChunks(b, 110).map((c, ci) => ({ text: c, cont: ci > 0 })),
        );
        return (
          <section className="tpl-section" key={`proj-${p.id}`}>
            {idx === 0 && secHead("projects", "Projects")}
            <div className="tpl-entry">
              <div className="tpl-project-header">
                <EditableField
                  tag="strong"
                  className="tpl-job-title"
                  isEditing={isEditing}
                  dataProjId={isEditing ? p.id : undefined}
                  onKeyDown={(e) =>
                    isEditing && onBackspace(e, "project", p.id)
                  }
                >
                  {p.title || "Project Title"}
                </EditableField>
                {(p.startDate || p.endDate || p.currentlyWorking) && (
                  <span className="tpl-date">
                    {p.startDate || ""}
                    {p.startDate ? " – " : ""}
                    {p.currentlyWorking ? "Currently Doing" : p.endDate || ""}
                  </span>
                )}
                {!isEditing && p.techStack?.length > 0 && (
                  <div className="tpl-tech-stack">
                    {p.techStack.map((t) => (
                      <span className="tpl-tech-badge" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isEditing ? (
                <ul className="preview-bullets">
                  {bullets.map((b, bi) =>
                    splitTextChunks(b, 110).map((c, ci) => (
                      <EditableField
                        key={`${p.id}-${bi}-${ci}`}
                        tag="li"
                        cont={ci > 0}
                        isEditing={isEditing}
                        dataProjChunk={ci}
                        dataBullet={bi}
                        dataId={p.id}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Backspace" &&
                            !e.currentTarget.innerText.trim()
                          ) {
                            e.preventDefault();
                            removeProject(p.id);
                          }
                        }}
                      >
                        {c}
                      </EditableField>
                    )),
                  )}
                </ul>
              ) : chunkItems.length > 0 ? (
                <ul className="preview-bullets">
                  {chunkItems.map((item, i) => (
                    <li key={i} className={item.cont ? "bullet-cont" : ""}>
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="tpl-desc">{formatBullets(p.description)}</div>
              )}
            </div>
          </section>
        );
      }),
    [projects, isEditing, customHeadings],
  );

  // ── Skills ─────────────────────────────────────────────────────────────────
  const skillsBlock = useMemo(() => {
    if (!allSkills.length) return null;
    return (
      <section className="tpl-section" key="skills">
        {secHead("skills", "Skills")}
        <div className="tpl-skills">
          {Object.entries(skills)
            .filter(([, v]) => v?.length > 0)
            .map(([cat, vals]) => (
              <div className="tpl-skill-row" key={cat}>
                <EditableField
                  tag="span"
                  className="tpl-skill-cat"
                  isEditing={isEditing}
                  dataSkillCat={isEditing ? cat : undefined}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}:
                </EditableField>
                <EditableField
                  tag="span"
                  className="tpl-skill-vals"
                  isEditing={isEditing}
                  dataSkillVals={isEditing ? cat : undefined}
                >
                  {vals.join(" | ")}
                </EditableField>
              </div>
            ))}
        </div>
      </section>
    );
  }, [skills, allSkills, isEditing, customHeadings]);

  // ── Certifications — SINGLE BLOCK ──────────────────────────────────────────
  // Rendered as ONE paginated unit so the section heading never strands on a
  // different page from its entries.
  const certBlocks = useMemo(() => {
    if (!certifications.length) return [];
    return [
      <section className="tpl-section" key="certs-all">
        {secHead("certifications", "Certifications")}
        {certifications.map((c) => (
          <div className="tpl-cert-entry" key={`cert-${c.id}`}>
            <EditableField
              tag="strong"
              isEditing={isEditing}
              dataCertId={isEditing ? c.id : undefined}
              dataCertField={isEditing ? "name" : undefined}
              onKeyDown={(e) =>
                isEditing && onBackspace(e, "certification", c.id)
              }
            >
              {c.name}
            </EditableField>
            {c.issuer && (
              <EditableField
                tag="span"
                className="tpl-company"
                isEditing={isEditing}
                dataCertId={isEditing ? c.id : undefined}
                dataCertField={isEditing ? "issuer" : undefined}
              >{` · ${c.issuer}`}</EditableField>
            )}
            {c.date && (
              <EditableField
                tag="span"
                className="tpl-date"
                style={{ marginLeft: 8 }}
                isEditing={isEditing}
                dataCertId={isEditing ? c.id : undefined}
                dataCertField={isEditing ? "date" : undefined}
              >{`(${c.date})`}</EditableField>
            )}
            {c.description && (
              <div
                className="tpl-cert-desc"
                style={{ fontSize: "0.85em", color: "inherit", marginTop: 2 }}
              >
                {c.description}
              </div>
            )}
          </div>
        ))}
      </section>,
    ];
  }, [certifications, isEditing, customHeadings]);

  // ── Achievements — SINGLE BLOCK ────────────────────────────────────────────
  // All bullets in one <section> so heading + every bullet move together.
  // Fixes: heading on page 1, bullets stranded on page 2.
  const achievementBlocks = useMemo(() => {
    if (!achievements.length) return [];
    return [
      <section className="tpl-section" key="achievements-all">
        {secHead("achievements", "Achievements")}
        <ul className="preview-bullets">
          {achievements.map((a) => (
            <EditableField
              key={`ach-${a.id}`}
              tag="li"
              isEditing={isEditing}
              dataAchId={isEditing ? a.id : undefined}
              onKeyDown={(e) =>
                isEditing && onBackspace(e, "achievement", a.id)
              }
            >
              {a.text}
            </EditableField>
          ))}
        </ul>
      </section>,
    ];
  }, [achievements, isEditing, customHeadings]);

  // ── Block arrays ───────────────────────────────────────────────────────────
  const flowBlocks = useMemo(() => {
    const h = layout === "minimal" ? headerMinimal : headerClassic;
    const b = [
      h,
      ...summaryBlocks,
      ...experienceBlocks,
      ...internshipBlocks,
      ...educationBlocks,
      ...projectBlocks,
    ];
    if (skillsBlock) b.push(skillsBlock);
    return [...b, ...certBlocks, ...achievementBlocks];
  }, [
    layout,
    headerMinimal,
    headerClassic,
    summaryBlocks,
    experienceBlocks,
    internshipBlocks,
    educationBlocks,
    projectBlocks,
    skillsBlock,
    certBlocks,
    achievementBlocks,
  ]);

  const colTopBlocks = useMemo(
    () => [headerCompact, ...summaryBlocks],
    [headerCompact, summaryBlocks],
  );
  const colLeftBlocks = useMemo(
    () => [...experienceBlocks, ...internshipBlocks, ...projectBlocks],
    [experienceBlocks, internshipBlocks, projectBlocks],
  );
  const colRightBlocks = useMemo(
    () => [
      ...educationBlocks,
      ...(skillsBlock ? [skillsBlock] : []),
      ...certBlocks,
      ...achievementBlocks,
    ],
    [educationBlocks, skillsBlock, certBlocks, achievementBlocks],
  );
  const sideMainBlocks = useMemo(
    () => [
      ...summaryBlocks,
      ...experienceBlocks,
      ...internshipBlocks,
      ...projectBlocks,
      ...educationBlocks,
    ],
    [
      summaryBlocks,
      experienceBlocks,
      internshipBlocks,
      projectBlocks,
      educationBlocks,
    ],
  );
  const sideBarBlocks = useMemo(
    () => [
      ...(skillsBlock ? [skillsBlock] : []),
      ...certBlocks,
      ...achievementBlocks,
    ],
    [skillsBlock, certBlocks, achievementBlocks],
  );

  // ── Pagination ─────────────────────────────────────────────────────────────
  // Constant PAGE_H = A4 height (1123) minus a 20px safe gutter.
  // A constant avoids DOM-measurement timing issues between desktop and mobile
  // emulation that previously caused extra/missing pages on device switch.
  const PAGE_H = 1103;

  useLayoutEffect(() => {
    if (layout === "classic" || layout === "minimal") {
      const heights = readHeights(mFlowRef);
      const sig = `${layout}|${storeVersion}|${heights.join(",")}`;
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        const newPages = paginate(flowBlocks, heights, PAGE_H);
        const nc = newPages.length;
        setFlowPages(newPages);
        if (nc > prevPageCount && prevPageCount > 0) setCurrentPage(nc - 1);
        setPrevPageCount(nc);
      }
    }
    if (layout === "columns") {
      const topH = readHeights(mTopRef).reduce((s, h) => s + h, 0);
      const lH = readHeights(mLeftRef);
      const rH = readHeights(mRightRef);
      const first = Math.max(200, PAGE_H - topH);
      const sig = `col|${storeVersion}|${topH}|${lH.join(",")}|${rH.join(",")}`;
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        const newColPages = {
          left: paginateFirstOther(colLeftBlocks, lH, first, PAGE_H),
          right: paginateFirstOther(colRightBlocks, rH, first, PAGE_H),
          top: colTopBlocks,
        };
        const nc = Math.max(
          1,
          Math.max(newColPages.left.length, newColPages.right.length, 1),
        );
        setColPages(newColPages);
        if (nc > prevPageCount && prevPageCount > 0) setCurrentPage(nc - 1);
        setPrevPageCount(nc);
      }
    }
    if (layout === "sidebar") {
      const mH = readHeights(mSideRef);
      const sig = `side|${storeVersion}|${mH.join(",")}`;
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        const newPages = paginate(sideMainBlocks, mH, PAGE_H);
        const nc = newPages.length;
        setSidePages(newPages);
        if (nc > prevPageCount && prevPageCount > 0) setCurrentPage(nc - 1);
        setPrevPageCount(nc);
      }
    }
  }, [
    layout,
    flowBlocks,
    colLeftBlocks,
    colRightBlocks,
    colTopBlocks,
    sideMainBlocks,
    storeVersion,
  ]);

  const isEmpty =
    !info.fullName &&
    !summary &&
    !experience.length &&
    !projects.length &&
    !internships.length &&
    !education.length;

  const handleDone = useCallback(() => {
    if (
      document.activeElement &&
      previewRef.current?.contains(document.activeElement)
    ) {
      document.activeElement.blur();
    }
    flushSync(() =>
      readAllEditsFromDOM(previewRef.current, useResumeStore.getState()),
    );
    useResumeStore.setState({ _editingPreview: false });
    setIsEditing(false);
    forceUpdate((n) => n + 1);
  }, []);

  const handleEdit = useCallback(() => {
    useResumeStore.setState({ _editingPreview: true });
    setIsEditing(true);
  }, []);

  const Page = ({ children, cls = "" }) => (
    <div className="preview-page-scaler">
      <div
        className={`preview-page tpl-layout-${layout}${cls}`}
        style={tplStyle}
      >
        <div className="page-body">{children}</div>
      </div>
    </div>
  );

  return (
    <div
      className="preview-wrapper"
      ref={(el) => {
        previewRef.current = el;
        wrapperRef.current = el;
      }}
    >
      {/* Label bar */}
      <div className="preview-label">
        <span className="preview-label-title">Live Preview</span>
        {totalPages > 1 && (
          <div className="preview-page-nav">
            <button
              className="preview-page-btn"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              ‹
            </button>
            <span className="preview-page-count">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              className="preview-page-btn"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage === totalPages - 1}
            >
              ›
            </button>
          </div>
        )}
        {totalPages === 1 && (
          <span className="preview-page-count preview-page-count--single">
            1 Page
          </span>
        )}
        <span className="preview-template-name">📄 {template.name}</span>
        <button
          type="button"
          className={`preview-edit-btn${isEditing ? " preview-edit-btn--done" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isEditing) {
              handleDone();
            } else {
              handleEdit();
            }
          }}
        >
          {isEditing ? "✓ Done" : "✏ Edit"}
        </button>
      </div>

      {/* Hidden measure containers */}
      {(layout === "classic" || layout === "minimal") && (
        <div data-measure="true">
          <div className={`preview-page tpl-layout-${layout}`} style={tplStyle}>
            <div className="page-body" ref={mFlowRef}>
              {flowBlocks.map((b, i) => (
                <div className="m-item" key={`mf${i}`}>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {layout === "columns" && (
        <div data-measure="true">
          <div className="preview-page tpl-layout-columns" style={tplStyle}>
            <div className="page-body">
              <div ref={mTopRef}>
                {colTopBlocks.map((b, i) => (
                  <div className="m-item" key={`mt${i}`}>
                    {b}
                  </div>
                ))}
              </div>
              <div className="tpl-columns">
                <div ref={mLeftRef}>
                  {colLeftBlocks.map((b, i) => (
                    <div className="m-item" key={`ml${i}`}>
                      {b}
                    </div>
                  ))}
                </div>
                <div ref={mRightRef}>
                  {colRightBlocks.map((b, i) => (
                    <div className="m-item" key={`mr${i}`}>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {layout === "sidebar" && (
        <div data-measure="true">
          <div className="preview-page tpl-layout-sidebar" style={tplStyle}>
            <div className="page-body">
              <div className="tpl-layout-grid">
                <aside className="tpl-side" />
                <div className="tpl-main" ref={mSideRef}>
                  {sideMainBlocks.map((b, i) => (
                    <div className="m-item" key={`ms${i}`}>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visible pages */}
      {isEmpty && (
        <Page>
          <div className="preview-empty">
            <div className="preview-empty-icon">📄</div>
            <p>
              Start filling your details on the left — your resume will appear
              here in real-time.
            </p>
          </div>
        </Page>
      )}

      {!isEmpty &&
        (layout === "classic" || layout === "minimal") &&
        (flowPages.length > 0 ? (
          flowPages.map((page, i) => <Page key={`fp${i}`}>{page}</Page>)
        ) : (
          <Page>{flowBlocks}</Page>
        ))}

      {!isEmpty &&
        layout === "columns" &&
        Array.from({
          length: Math.max(colPages.left.length, colPages.right.length, 1),
        }).map((_, i) => (
          <div key={`cp${i}`} className="preview-page-scaler">
            <div className="preview-page tpl-layout-columns" style={tplStyle}>
              <div className="page-body">
                {i === 0 && colPages.top}
                <div className="tpl-columns">
                  <div>{colPages.left[i] || null}</div>
                  <div>{colPages.right[i] || null}</div>
                </div>
              </div>
            </div>
          </div>
        ))}

      {!isEmpty &&
        layout === "sidebar" &&
        (sidePages.length > 0 ? sidePages : [sideMainBlocks]).map((page, i) => (
          <div key={`sp${i}`} className="preview-page-scaler">
            <div className="preview-page tpl-layout-sidebar" style={tplStyle}>
              <div className="page-body">
                <div className="tpl-layout-grid">
                  <aside className="tpl-side">
                    <div className="tpl-side-header">
                      <div className="tpl-side-name">
                        {info.fullName || "Your Name"}
                      </div>
                      <div className="tpl-side-contact">
                        {info.email && (
                          <a
                            href={`mailto:${info.email}`}
                            className="tpl-contact-link"
                          >
                            ✉ {info.email}
                          </a>
                        )}
                        {info.phone && (
                          <a
                            href={`tel:${info.phone.replace(/\D/g, "")}`}
                            className="tpl-contact-link"
                          >
                            📞 {info.phone}
                          </a>
                        )}
                        {info.linkedin && (
                          <a
                            href={getLinkedinUrl(info.linkedin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tpl-contact-link"
                          >
                            🔗 {info.linkedin}
                          </a>
                        )}
                        {info.github && (
                          <a
                            href={getGithubUrl(info.github)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tpl-contact-link"
                          >
                            🐙 {info.github}
                          </a>
                        )}
                        {info.portfolio && (
                          <a
                            href={formatUrl(info.portfolio)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tpl-contact-link"
                          >
                            🌐 {info.portfolio}
                          </a>
                        )}
                      </div>
                    </div>
                    {i === 0 && sideBarBlocks}
                  </aside>
                  <div className="tpl-main">{page}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

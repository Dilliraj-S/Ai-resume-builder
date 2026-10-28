import React from "react";
import { TEMPLATES } from "../templates/templateData";

const PreviewSkeleton = ({ templateId }) => {
  // Match by id or partial id (e.g., "modern-1" matches "modern")
  const template = TEMPLATES.find(t => templateId?.startsWith(t.id)) || TEMPLATES.find(t => t.id === "modern") || TEMPLATES[0];
  const primary = template.defaultPrimary;
  const accent = template.defaultAccent;

  const sectionStyle = {
    border: `1px solid ${accent}40`,
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "10px",
  };

  const lineStyle = {
    height: "8px",
    background: primary,
    borderRadius: "3px",
    marginBottom: "6px",
    opacity: 0.8,
  };

  const subLineStyle = {
    height: "6px",
    background: primary,
    borderRadius: "2px",
    marginBottom: "4px",
    opacity: 0.5,
  };

  const bulletStyle = {
    height: "5px",
    background: primary,
    borderRadius: "2px",
    marginBottom: "3px",
    marginLeft: "10px",
    opacity: 0.3,
  };

  if (template.layout === "modern") {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "8px", borderBottom: `2px solid ${primary}` }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: primary }} />
          <div>
            <div style={{ ...lineStyle, width: "60%", height: "12px" }} />
            <div style={{ ...subLineStyle, width: "40%" }} />
          </div>
        </div>
        <div style={sectionStyle}>
          <div style={{ ...subLineStyle, width: "95%" }} />
          <div style={{ ...subLineStyle, width: "85%" }} />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "95%" }} />
            <div style={{ ...bulletStyle }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "90%" }} />
            <div style={{ ...bulletStyle }} />
          </div>
        </div>
      </div>
    );
  }

  if (template.layout === "sidebar") {
    return (
      <div style={{ display: "flex", padding: "16px", gap: "12px", height: "100%" }}>
        <div style={{ width: "35%", background: primary, borderRadius: "4px" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ ...lineStyle, width: "80%", height: "16px" }} />
          <div style={{ ...subLineStyle, width: "50%" }} />
          <div style={{ ...sectionStyle, marginTop: "8px" }}>
            <div style={{ ...subLineStyle, width: "90%" }} />
            <div style={{ ...bulletStyle }} />
            <div style={{ ...bulletStyle }} />
          </div>
          <div style={sectionStyle}>
            <div style={{ ...subLineStyle, width: "85%" }} />
            <div style={{ ...bulletStyle }} />
            <div style={{ ...bulletStyle }} />
          </div>
        </div>
      </div>
    );
  }

  if (template.layout === "columns") {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ ...lineStyle, width: "60%", height: "14px" }} />
        <div style={{ ...subLineStyle, width: "40%" }} />
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "90%" }} />
            <div style={{ ...subLineStyle, width: "85%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "90%" }} />
            <div style={{ ...subLineStyle, width: "80%" }} />
          </div>
        </div>
        <div style={sectionStyle}>
          <div style={{ ...subLineStyle, width: "95%" }} />
          <div style={{ ...bulletStyle }} />
          <div style={{ ...bulletStyle }} />
        </div>
        <div style={sectionStyle}>
          <div style={{ ...subLineStyle, width: "90%" }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  if (template.layout === "minimal") {
    return (
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ ...lineStyle, width: "50%", height: "16px" }} />
        <div style={{ ...subLineStyle, width: "30%" }} />
        <div style={{ borderTop: `2px solid ${primary}`, paddingTop: "10px" }}>
          <div style={{ ...subLineStyle, width: "95%" }} />
          <div style={{ ...subLineStyle, width: "88%" }} />
          <div style={{ ...subLineStyle, width: "92%" }} />
        </div>
        <div>
          <div style={{ ...bulletStyle }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  // Timeline layout
  if (template.layout === "timeline") {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ ...lineStyle, width: "50%", height: "12px" }} />
        <div style={{ ...subLineStyle, width: "35%" }} />
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <div style={{ width: "4px", background: accent, borderRadius: "2px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "80%" }} />
            <div style={{ ...bulletStyle }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ width: "4px", background: accent, borderRadius: "2px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...subLineStyle, width: "75%" }} />
            <div style={{ ...bulletStyle }} />
          </div>
        </div>
      </div>
    );
  }

  // Card Grid layout
  if (template.layout === "card-grid") {
    return (
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ ...lineStyle, width: "45%", height: "14px" }} />
        <div style={{ ...subLineStyle, width: "30%" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
          <div style={{ background: `${accent}30`, padding: "8px", borderRadius: "4px" }}>
            <div style={{ ...subLineStyle, width: "70%", marginBottom: "4px" }} />
            <div style={{ ...bulletStyle }} />
          </div>
          <div style={{ background: `${accent}30`, padding: "8px", borderRadius: "4px" }}>
            <div style={{ ...subLineStyle, width: "70%", marginBottom: "4px" }} />
            <div style={{ ...bulletStyle }} />
          </div>
          <div style={{ background: `${accent}30`, padding: "8px", borderRadius: "4px" }}>
            <div style={{ ...subLineStyle, width: "70%", marginBottom: "4px" }} />
            <div style={{ ...bulletStyle }} />
          </div>
          <div style={{ background: `${accent}30`, padding: "8px", borderRadius: "4px" }}>
            <div style={{ ...subLineStyle, width: "70%", marginBottom: "4px" }} />
            <div style={{ ...bulletStyle }} />
          </div>
        </div>
      </div>
    );
  }

  // Split layout
  if (template.layout === "split" || template.layout === "split-screen") {
    return (
      <div style={{ display: "flex", height: "100%" }}>
        <div style={{ width: "45%", background: primary, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ ...lineStyle, width: "80%", height: "10px", background: "#fff" }} />
          <div style={{ ...subLineStyle, width: "60%", background: "#fff", opacity: 0.7 }} />
          <div style={{ ...bulletStyle, background: "#fff", marginTop: "12px" }} />
          <div style={{ ...bulletStyle, background: "#fff" }} />
        </div>
        <div style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ ...subLineStyle, width: "90%" }} />
          <div style={{ ...subLineStyle, width: "85%" }} />
          <div style={{ ...bulletStyle }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  // Top Accent layout
  if (template.layout === "top-accent" || template.layout === "header-accent") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ height: "35px", background: primary, display: "flex", alignItems: "center", padding: "0 12px" }}>
          <div style={{ ...lineStyle, width: "40%", height: "8px", background: "#fff", margin: 0 }} />
        </div>
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ ...lineStyle, width: "50%", height: "10px" }} />
          <div style={{ ...subLineStyle, width: "35%" }} />
          <div style={{ ...subLineStyle, width: "90%", marginTop: "4px" }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  // Bold Header layout
  if (template.layout === "bold-header") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ background: primary, padding: "12px", textAlign: "center" }}>
          <div style={{ ...lineStyle, width: "40%", height: "10px", background: "#fff", margin: "0 auto 6px" }} />
          <div style={{ ...subLineStyle, width: "25%", background: "#fff", margin: "0 auto", opacity: 0.7 }} />
        </div>
        <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ ...subLineStyle, width: "95%" }} />
          <div style={{ ...subLineStyle, width: "90%" }} />
          <div style={{ ...bulletStyle }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  // Box layout
  if (template.layout === "box") {
    return (
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ ...lineStyle, width: "45%", height: "12px" }} />
        <div style={{ ...subLineStyle, width: "30%" }} />
        <div style={{ border: `1px solid ${accent}`, borderRadius: "4px", padding: "8px", marginTop: "4px" }}>
          <div style={{ ...subLineStyle, width: "90%" }} />
          <div style={{ ...bulletStyle }} />
        </div>
        <div style={{ border: `1px solid ${accent}`, borderRadius: "4px", padding: "8px" }}>
          <div style={{ ...subLineStyle, width: "85%" }} />
          <div style={{ ...bulletStyle }} />
        </div>
        <div style={{ border: `1px solid ${accent}`, borderRadius: "4px", padding: "8px" }}>
          <div style={{ ...subLineStyle, width: "80%" }} />
          <div style={{ ...bulletStyle }} />
        </div>
      </div>
    );
  }

  // Gradient layout
  if (template.layout === "gradient") {
    return (
      <div style={{ height: "100%", background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`, padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ ...lineStyle, width: "50%", height: "10px", background: "#fff", opacity: 0.9 }} />
        <div style={{ ...subLineStyle, width: "35%", background: "#fff", opacity: 0.7 }} />
        <div style={{ background: "#fff", borderRadius: "4px", padding: "8px", marginTop: "4px", opacity: 0.9 }}>
          <div style={{ ...subLineStyle, width: "90%", background: primary, opacity: 0.5, marginBottom: "3px" }} />
          <div style={{ ...bulletStyle, background: primary, opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  // Minimalist layout
  if (template.layout === "minimalist") {
    return (
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ ...lineStyle, width: "40%", height: "14px" }} />
        <div style={{ ...subLineStyle, width: "25%" }} />
        <div style={{ borderTop: `1px solid ${primary}`, paddingTop: "8px" }}>
          <div style={{ ...subLineStyle, width: "100%" }} />
          <div style={{ ...subLineStyle, width: "95%" }} />
          <div style={{ ...subLineStyle, width: "90%" }} />
        </div>
      </div>
    );
  }

  // Sectioned layout
  if (template.layout === "sectioned") {
    return (
      <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ background: primary, color: "#fff", padding: "4px 8px", borderRadius: "2px", fontSize: "6px", fontWeight: "bold" }}>
          <div style={{ ...lineStyle, width: "30%", height: "4px", background: "#fff", margin: 0, opacity: 0.9 }} />
        </div>
        <div style={{ ...subLineStyle, width: "95%", marginTop: "2px" }} />
        <div style={{ ...bulletStyle }} />
        <div style={{ background: primary, color: "#fff", padding: "4px 8px", borderRadius: "2px", fontSize: "6px", fontWeight: "bold", marginTop: "4px" }}>
          <div style={{ ...lineStyle, width: "35%", height: "4px", background: "#fff", margin: 0, opacity: 0.9 }} />
        </div>
        <div style={{ ...subLineStyle, width: "90%", marginTop: "2px" }} />
        <div style={{ ...bulletStyle }} />
      </div>
    );
  }

  // Icons layout
  if (template.layout === "icons") {
    return (
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: accent }} />
          <div style={{ ...lineStyle, width: "50%", height: "8px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: accent }} />
          <div style={{ ...subLineStyle, width: "70%" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: accent }} />
          <div style={{ ...subLineStyle, width: "60%" }} />
        </div>
      </div>
    );
  }

  // Footer Header layout
  if (template.layout === "footer-header") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ flex: 1, padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ ...lineStyle, width: "55%", height: "12px" }} />
          <div style={{ ...subLineStyle, width: "40%" }} />
          <div style={{ ...subLineStyle, width: "90%", marginTop: "4px" }} />
          <div style={{ ...bulletStyle }} />
          <div style={{ ...bulletStyle }} />
        </div>
        <div style={{ background: primary, padding: "8px", display: "flex", justifyContent: "center", gap: "12px" }}>
          <div style={{ width: "20px", height: "6px", background: "#fff", borderRadius: "2px", opacity: 0.8 }} />
          <div style={{ width: "20px", height: "6px", background: "#fff", borderRadius: "2px", opacity: 0.8 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <div style={{ ...lineStyle, width: "50%", height: "12px", margin: "0 auto 6px" }} />
        <div style={{ ...subLineStyle, width: "30%", margin: "0 auto" }} />
      </div>
      <div style={sectionStyle}>
        <div style={{ ...subLineStyle, width: "90%" }} />
        <div style={{ ...bulletStyle }} />
        <div style={{ ...bulletStyle }} />
      </div>
      <div style={sectionStyle}>
        <div style={{ ...subLineStyle, width: "85%" }} />
        <div style={{ ...bulletStyle }} />
      </div>
      <div style={sectionStyle}>
        <div style={{ ...subLineStyle, width: "80%" }} />
        <div style={{ ...bulletStyle }} />
      </div>
    </div>
  );
};

export default PreviewSkeleton;
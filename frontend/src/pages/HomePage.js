import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { analyticsAPI, authAPI } from "../services/api";
import ResumeUpload from "../components/home/ResumeUpload";
import ResumeListModal from "../components/dashboard/ResumeListModal";
import LoginModal from "../components/auth/LoginModal";
import useResumeStore from "../store/resumeStore";
import toast from "react-hot-toast";
import "./HomePage.css";

const FEATURES = [
  {
    icon: "📄",
    label: "Premium Templates",
    desc: "Professionally designed, ATS-parseable layouts that pass every applicant tracking system.",
    color: "#3b82f6",
  },
  {
    icon: "🤖",
    label: "AI Content Enhancement",
    desc: "AI transforms your experience with action verbs, metrics, and industry keywords.",
    color: "#8b5cf6",
  },
  {
    icon: "📊",
    label: "ATS Score Checker",
    desc: "Check your resume ATS score and get AI suggestions to maximize your interview chances.",
    color: "#10b981",
  },
  {
    icon: "📑",
    label: "Smart Pagination",
    desc: "Content-aware flow that automatically spans 2-3 pages while keeping critical info on page one.",
    color: "#f59e0b",
  },
  {
    icon: "⚡",
    label: "Instant PDF Export",
    desc: "Pixel-perfect, print-ready PDFs that exactly match your live preview with one click.",
    color: "#ef4444",
  },
  {
    icon: "✍️",
    label: "Grammar & Tone Fix",
    desc: "One-click corrections for grammar, spelling, and professional tone throughout your resume.",
    color: "#06b6d4",
  },
];

const STEPS = [
  {
    icon: "✏️",
    step: "01",
    title: "Fill Your Details",
    desc: "Enter work, education, skills, and projects in guided sections.",
    color: "#3b82f6",
  },
  {
    icon: "✨",
    step: "02",
    title: "AI Enhances Content",
    desc: "AI rewrites each section with action verbs, metrics, and keywords.",
    color: "#7c3aed",
  },
  {
    icon: "🎨",
    step: "03",
    title: "Pick a Template",
    desc: "Choose from premium ATS-safe templates with live side-by-side preview.",
    color: "#0891b2",
  },
  {
    icon: "🚀",
    step: "04",
    title: "Download and Apply",
    desc: "Export a pixel-perfect PDF instantly and start applying with confidence.",
    color: "#059669",
  },
];

const TESTIMONIALS = [
  {
    name: "Arjun Sharma",
    role: "SWE @ Google",
    text: "Got 3× more callbacks after using ResumeAI. The AI rewrites are genuinely impressive — it added metrics I didn't even think to include.",
    avatar: "AS",
    color: "#3b82f6",
    highlight: "3× more callbacks",
  },
  {
    name: "Priya Nair",
    role: "Data Analyst @ Amazon",
    text: "The ATS score feature is a total game changer. I went from a score of 45 to 91 in just 20 minutes. Landed my interview the next week.",
    avatar: "PN",
    color: "#10b981",
    highlight: "45 → 91 ATS score",
  },
  {
    name: "Rahul Verma",
    role: "Software Engineer @ Infosys",
    text: "As a fresher I had no idea how to structure my resume. ResumeAI made it effortless. Got placed at Infosys within 3 weeks of signing up.",
    avatar: "RV",
    color: "#8b5cf6",
    highlight: "Placed in 3 weeks",
  },
  {
    name: "Sneha Reddy",
    role: "Product Manager @ Flipkart",
    text: "The templates are beautiful and actually ATS-friendly — not just pretty designs. Landed my dream PM role within 2 weeks of downloading!",
    avatar: "SR",
    color: "#f59e0b",
    highlight: "Dream job in 2 weeks",
  },
  {
    name: "Vikram Singh",
    role: "DevOps Engineer @ TCS",
    text: "Multi-page support is excellent. My 3-page resume with all my DevOps certs looks perfectly formatted. No other tool handled it this well.",
    avatar: "VS",
    color: "#ef4444",
    highlight: "Multi-page perfection",
  },
  {
    name: "Anjali Patel",
    role: "UX Designer @ PayPal",
    text: "The AI suggestions helped me turn vague bullet points into measurable achievements. My portfolio stands out so much more now.",
    avatar: "AP",
    color: "#06b6d4",
    highlight: "Metrics that impress",
  },
];

const TEMPLATES = [
  {
    name: "Modern",
    badge: "Popular",
    accentColor: "#1e40af",
    bgColor: "#f8fafc",
    previewType: "modern",
  },
  {
    name: "Minimal",
    badge: "Clean",
    accentColor: "#1e293b",
    bgColor: "#ffffff",
    previewType: "minimal",
  },
  {
    name: "Executive",
    badge: "Premium",
    accentColor: "#3b82f6",
    bgColor: "#0f172a",
    previewType: "executive",
  },
  {
    name: "MBA",
    badge: "Business",
    accentColor: "#7c3aed",
    bgColor: "#faf5ff",
    previewType: "mba",
  },
  {
    name: "Medical",
    badge: "Clinical",
    accentColor: "#0f766e",
    bgColor: "#ffffff",
    previewType: "medical",
  },
  {
    name: "Creative",
    badge: "Design",
    accentColor: "#be185d",
    bgColor: "#fff1f2",
    previewType: "creative",
  },
];

/* ── Animated counter ─────────────────────────────────────── */
const Counter = ({ end, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ── Template SVG Previews ────────────────────────────────── */
const TemplatePreviews = {
  modern: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="#f8fafc" />
      <rect x="0" y="0" width="90" height="200" fill="#1e40af" />
      <circle cx="45" cy="44" r="22" fill="white" opacity=".2" />
      <rect
        x="12"
        y="72"
        width="66"
        height="5"
        rx="2.5"
        fill="white"
        opacity=".7"
      />
      <rect
        x="18"
        y="82"
        width="54"
        height="3"
        rx="1.5"
        fill="white"
        opacity=".4"
      />
      <rect
        x="12"
        y="100"
        width="36"
        height="3"
        rx="1.5"
        fill="white"
        opacity=".5"
      />
      <rect
        x="12"
        y="108"
        width="66"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".3"
      />
      <rect
        x="12"
        y="115"
        width="58"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".3"
      />
      <rect
        x="12"
        y="122"
        width="62"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".3"
      />
      <rect
        x="12"
        y="144"
        width="36"
        height="3"
        rx="1.5"
        fill="white"
        opacity=".5"
      />
      <rect
        x="12"
        y="152"
        width="66"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".3"
      />
      <rect
        x="12"
        y="159"
        width="50"
        height="2.5"
        rx="1"
        fill="white"
        opacity=".3"
      />
      <rect x="105" y="16" width="120" height="7" rx="3" fill="#1e293b" />
      <rect x="105" y="28" width="80" height="4" rx="2" fill="#64748b" />
      <rect x="105" y="36" width="95" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="105" y="52" width="55" height="4" rx="2" fill="#1e40af" />
      <rect x="105" y="60" width="155" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="67" width="140" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="74" width="150" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="90" width="55" height="4" rx="2" fill="#1e40af" />
      <rect x="105" y="100" width="155" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="107" width="130" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="114" width="145" height="2.5" rx="1" fill="#cbd5e1" />
      <rect x="105" y="130" width="55" height="4" rx="2" fill="#1e40af" />
      <rect x="105" y="140" width="155" height="2" rx="1" fill="#e2e8f0" />
      <rect x="105" y="146" width="120" height="2" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  minimal: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="white" />
      <rect x="20" y="14" width="240" height="1" fill="#1e293b" />
      <rect x="20" y="20" width="140" height="8" rx="2" fill="#1e293b" />
      <rect x="20" y="32" width="90" height="4" rx="2" fill="#64748b" />
      <rect x="20" y="40" width="110" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="20" y="52" width="240" height="1" fill="#e2e8f0" />
      <rect x="20" y="62" width="50" height="4" rx="2" fill="#1e293b" />
      <rect x="20" y="72" width="240" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="79" width="200" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="86" width="220" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="100" width="50" height="4" rx="2" fill="#1e293b" />
      <rect x="20" y="110" width="240" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="117" width="180" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="124" width="210" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="20" y="138" width="50" height="4" rx="2" fill="#1e293b" />
      <rect
        x="20"
        y="148"
        width="60"
        height="14"
        rx="7"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <rect
        x="86"
        y="148"
        width="54"
        height="14"
        rx="7"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <rect
        x="146"
        y="148"
        width="70"
        height="14"
        rx="7"
        fill="#f1f5f9"
        stroke="#e2e8f0"
        strokeWidth="1"
      />
      <rect x="20" y="180" width="240" height="1" fill="#1e293b" />
    </svg>
  ),
  executive: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="#0f172a" />
      <rect x="0" y="0" width="280" height="68" fill="#1e293b" />
      <rect x="20" y="14" width="120" height="8" rx="2" fill="white" />
      <rect x="20" y="26" width="80" height="4" rx="2" fill="#94a3b8" />
      <rect x="20" y="34" width="100" height="3" rx="1.5" fill="#64748b" />
      <rect x="20" y="42" width="4" height="4" rx="2" fill="#3b82f6" />
      <rect x="28" y="42" width="70" height="4" rx="2" fill="#475569" />
      <rect x="20" y="50" width="4" height="4" rx="2" fill="#3b82f6" />
      <rect x="28" y="50" width="60" height="4" rx="2" fill="#475569" />
      <rect x="0" y="68" width="280" height="2" fill="#3b82f6" opacity=".6" />
      <rect x="20" y="80" width="50" height="4" rx="2" fill="#3b82f6" />
      <rect x="20" y="90" width="240" height="2.5" rx="1" fill="#334155" />
      <rect x="20" y="97" width="200" height="2.5" rx="1" fill="#334155" />
      <rect x="20" y="104" width="220" height="2.5" rx="1" fill="#334155" />
      <rect x="20" y="118" width="50" height="4" rx="2" fill="#3b82f6" />
      <rect x="20" y="128" width="240" height="2.5" rx="1" fill="#334155" />
      <rect x="20" y="135" width="180" height="2.5" rx="1" fill="#334155" />
      <rect x="20" y="152" width="50" height="4" rx="2" fill="#3b82f6" />
      <rect x="20" y="162" width="240" height="2" rx="1" fill="#334155" />
      <rect x="20" y="169" width="200" height="2" rx="1" fill="#334155" />
      <rect x="20" y="176" width="220" height="2" rx="1" fill="#334155" />
    </svg>
  ),
  mba: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="#faf5ff" />
      <rect x="0" y="0" width="280" height="56" fill="#7c3aed" />
      <rect x="20" y="12" width="130" height="8" rx="2" fill="white" />
      <rect
        x="20"
        y="24"
        width="90"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.6)"
      />
      <rect
        x="20"
        y="32"
        width="110"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.4)"
      />
      <rect x="0" y="56" width="280" height="3" fill="#a78bfa" />
      <rect x="20" y="70" width="55" height="4" rx="2" fill="#7c3aed" />
      <rect x="20" y="80" width="240" height="2.5" rx="1" fill="#ddd6fe" />
      <rect x="20" y="87" width="200" height="2.5" rx="1" fill="#ddd6fe" />
      <rect x="20" y="94" width="220" height="2.5" rx="1" fill="#ddd6fe" />
      <rect x="20" y="110" width="55" height="4" rx="2" fill="#7c3aed" />
      <rect x="20" y="120" width="240" height="2.5" rx="1" fill="#ddd6fe" />
      <rect x="20" y="127" width="180" height="2.5" rx="1" fill="#ddd6fe" />
      <rect x="20" y="144" width="55" height="4" rx="2" fill="#7c3aed" />
      <rect x="20" y="154" width="62" height="14" rx="7" fill="#ede9fe" />
      <rect x="88" y="154" width="50" height="14" rx="7" fill="#ede9fe" />
      <rect x="144" y="154" width="66" height="14" rx="7" fill="#ede9fe" />
      <rect x="216" y="154" width="44" height="14" rx="7" fill="#ede9fe" />
    </svg>
  ),
  medical: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="white" />
      <rect x="0" y="0" width="8" height="200" fill="#0f766e" />
      <rect x="18" y="14" width="130" height="8" rx="2" fill="#0f172a" />
      <rect x="18" y="26" width="90" height="4" rx="2" fill="#64748b" />
      <rect x="18" y="34" width="110" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="18" y="46" width="242" height="1" fill="#e2e8f0" />
      <rect x="18" y="56" width="55" height="4" rx="2" fill="#0f766e" />
      <rect x="18" y="66" width="242" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="73" width="200" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="80" width="220" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="96" width="55" height="4" rx="2" fill="#0f766e" />
      <rect x="18" y="106" width="242" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="113" width="180" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="130" width="55" height="4" rx="2" fill="#0f766e" />
      <rect x="18" y="140" width="242" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="147" width="200" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="154" width="220" height="2.5" rx="1" fill="#e2e8f0" />
      <rect x="18" y="170" width="55" height="4" rx="2" fill="#0f766e" />
      <rect x="18" y="180" width="60" height="12" rx="6" fill="#ccfbf1" />
      <rect x="84" y="180" width="56" height="12" rx="6" fill="#ccfbf1" />
      <rect x="146" y="180" width="72" height="12" rx="6" fill="#ccfbf1" />
    </svg>
  ),
  creative: () => (
    <svg width="100%" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="280" height="200" fill="#fff1f2" />
      <circle cx="50" cy="50" r="36" fill="#be185d" opacity=".12" />
      <circle cx="50" cy="50" r="28" fill="#be185d" opacity=".15" />
      <circle cx="50" cy="50" r="20" fill="#be185d" opacity=".3" />
      <rect x="96" y="16" width="110" height="8" rx="2" fill="#1e293b" />
      <rect x="96" y="28" width="80" height="4" rx="2" fill="#64748b" />
      <rect
        x="96"
        y="36"
        width="95"
        height="3"
        rx="1.5"
        fill="#be185d"
        opacity=".7"
      />
      <rect x="96" y="44" width="70" height="3" rx="1.5" fill="#94a3b8" />
      <rect x="16" y="96" width="248" height="1.5" fill="#fda4af" />
      <rect x="16" y="106" width="50" height="4" rx="2" fill="#be185d" />
      <rect x="16" y="116" width="248" height="2.5" rx="1" fill="#fecdd3" />
      <rect x="16" y="123" width="200" height="2.5" rx="1" fill="#fecdd3" />
      <rect x="16" y="130" width="220" height="2.5" rx="1" fill="#fecdd3" />
      <rect x="16" y="146" width="50" height="4" rx="2" fill="#be185d" />
      <rect x="16" y="156" width="248" height="2.5" rx="1" fill="#fecdd3" />
      <rect x="16" y="163" width="180" height="2.5" rx="1" fill="#fecdd3" />
      <rect x="16" y="176" width="50" height="4" rx="2" fill="#be185d" />
      <rect
        x="16"
        y="186"
        width="60"
        height="12"
        rx="6"
        fill="#fda4af"
        opacity=".5"
      />
      <rect
        x="82"
        y="186"
        width="54"
        height="12"
        rx="6"
        fill="#fda4af"
        opacity=".5"
      />
      <rect
        x="142"
        y="186"
        width="68"
        height="12"
        rx="6"
        fill="#fda4af"
        opacity=".5"
      />
    </svg>
  ),
};

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_resumes: parseInt(process.env.REACT_APP_STATS_RESUMES) || 0,
    total_users: parseInt(process.env.REACT_APP_STATS_USERS) || 0,
    total_downloads: parseInt(process.env.REACT_APP_STATS_DOWNLOADS) || 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTrigger, setLoginTrigger] = useState(0);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("rb_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [searchParams] = useSearchParams();
  const {
    setResumeData,
    setActiveSection,
    createNewResume,
    loadResume,
    resumeList,
    setAtsScore,
  } = useResumeStore();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem("rb_token");
    if (token && !searchParams.get("login") && !searchParams.get("login_success")) {
      navigate("/dashboard");
      return;
    }
    
    // Clear storage via URL: ?clear
    if (searchParams.get("clear") === "true") {
      localStorage.clear();
      sessionStorage.clear();
      window.history.replaceState({}, "", "/");
      toast.success('Storage cleared! Refresh to login again.');
    }
    if (searchParams.get("login") === "true") {
      setShowLoginModal(true);
    }
    if (searchParams.get("login_success") === "true") {
      setLoginTrigger((t) => t + 1);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  const handleLogin = (userData) => {
    setUser(userData);
    setLoginTrigger((t) => t + 1);
    toast.success(`Welcome, ${userData.name || "User"}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("rb_token");
    localStorage.removeItem("rb_user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  const handleImportComplete = useCallback(
    async (parsedResume, atsResult = null) => {
      console.log('[Import] Starting import with:', { parsedResume: !!parsedResume, atsResult: !!atsResult, user: !!user });
      
      if (!parsedResume) {
        console.error('[Import] No parsed resume provided');
        toast.error('Failed to import resume. Please try again.');
        return;
      }

      try {
        console.log('[Import] Creating new resume with ATS score:', atsResult?.score);
        const newResume = await createNewResume("Imported Resume", atsResult?.score || null);
        console.log('[Import] New resume created:', newResume);

        if (!newResume) {
          console.error('[Import] Failed to create resume');
          toast.error('Failed to create resume. Please try again.');
          return;
        }

        console.log('[Import] Setting resume data...');
        setResumeData({
          basicInfo: parsedResume.basicInfo || {},
          summary: parsedResume.summary || "",
          profileType:
            parsedResume.profileType ||
            (parsedResume.experience?.length > 0 ? "experienced" : "fresher"),
          hasInternship:
            parsedResume.hasInternship ||
            parsedResume.internships?.length > 0,
          experience: parsedResume.experience || [],
          internships: parsedResume.internships || [],
          education: parsedResume.education || [],
          projects: parsedResume.projects || [],
          skills: parsedResume.skills || {},
          certifications: parsedResume.certifications || [],
          achievements: parsedResume.achievements || [],
        });

        if (atsResult && atsResult.score) {
          const suggestions = atsResult.suggestions || [];
          const feedback = suggestions.map((s) => ({
            type: s.type || "info",
            text: s.text || s,
          }));
          setAtsScore(atsResult.score, feedback);
          useResumeStore
            .getState()
            .updateResumeAtsScore(newResume.id, atsResult.score, atsResult);
        }

        console.log('[Import] Navigating to builder...');
        setActiveSection("basicInfo");
        navigate("/builder");
        toast.success('Resume imported successfully!');
      } catch (error) {
        console.error('[Import] Error:', error);
        toast.error('Failed to import resume. Please try again.');
      }
    },
    [navigate, setResumeData, setActiveSection, createNewResume, user],
  );

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    analyticsAPI
      .getStats()
      .then((res) => {
        const data = res?.data || res;
        if (data) setStats(data);
      })
      .catch(() => {});
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="home">
      {/* ── NAV ── */}
      <nav className={`home-nav${scrolled ? " home-nav--scrolled" : ""}`}>
        <div className="container nav-container">
<a href={user ? "/dashboard" : "/"} className="nav-logo">
              ResumeAI
            </a>
          <div className={`nav-links${menuOpen ? " nav-links--open" : ""}`}>
            <a href="#features" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it Works
            </a>
            <a href="#templates" onClick={() => setMenuOpen(false)}>
              Templates
            </a>
            <a href="#testimonials" onClick={() => setMenuOpen(false)}>
              Reviews
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)}>
              Pricing
            </a>
            <a href="#upload-section" onClick={() => setMenuOpen(false)}>
              ATS Checker
            </a>
          </div>
          <div className="nav-cta">
            {user ? (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate("/dashboard")}
                >
                  My Resumes
                </button>
                <div className="user-menu">
                  <span className="user-name">{user.name}</span>
                </div>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowLoginModal(true)}
                >
                  Sign In
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowLoginModal(true)}
                >
                  Build Free Resume
                </button>
              </>
            )}
          </div>
          <button
            className="nav-burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob-1" />
          <div className="hero-blob blob-2" />
          <div className="hero-blob blob-3" />
          <div className="hero-grid" />
          <div className="hero-noise" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            AI-Powered · ATS-Optimized · Premium Templates · By CodeSpidey
          </div>
          <h1 className="hero-title">
            Build a Resume That
            <span className="hero-gradient"> Gets You Hired</span>
          </h1>
          <p className="hero-subtitle">
            AI-powered resume builder with ATS scoring, premium templates,
            and real-time content enhancement. From fresher to
            executive, create resumes that pass ATS filters and impress hiring
            managers.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-cta btn-lg"
              onClick={() =>
                document
                  .getElementById("upload-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Check Your Resume ATS Score
              <span className="btn-arrow">→</span>
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() =>
                user ? navigate("/builder") : setShowLoginModal(true)
              }
            >
              Build Your Resume
            </button>
          </div>

          {/* ── COMPACT STATS BAR ── */}
          <div className="hero-stats-bar">
            <div className="hsb-item">
              <strong className="hsb-num hsb-blue">
                <Counter end={stats.total_resumes || 12450} suffix="+" />
              </strong>
              <span className="hsb-label">Resumes Created</span>
            </div>
            <div className="hsb-divider" />
            <div className="hsb-item">
              <strong className="hsb-num hsb-green">
                <Counter end={stats.total_users || 8900} suffix="+" />
              </strong>
              <span className="hsb-label">Happy Users</span>
            </div>
            <div className="hsb-divider" />
            <div className="hsb-item">
              <strong className="hsb-num hsb-violet">
                <Counter end={stats.total_downloads || 31200} suffix="+" />
              </strong>
              <span className="hsb-label">PDFs Downloaded</span>
            </div>
            <div className="hsb-divider" />
            <div className="hsb-item">
              <strong className="hsb-num hsb-amber">Premium</strong>
              <span className="hsb-label">ATS Templates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── UPLOAD & ANALYZE SECTION ── */}
      <section className="section upload-analyze-section" id="upload-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag section-tag--blue">
              Analyze & Improve
            </span>
            <h2>Have an Existing Resume?</h2>
            <p>
              Upload your resume and we'll analyze it, check the ATS score, and
              help you enhance it with AI.
            </p>
          </div>
          <div className="upload-analyze-wrapper">
            <ResumeUpload
              onImportComplete={handleImportComplete}
              user={user}
              loginTrigger={loginTrigger}
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Why ResumeAI</span>
            <h2>Everything You Need to Land the Job</h2>
            <p>
              A complete resume toolkit with AI writing, ATS optimization, and
              beautiful templates in one place.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  "--accent-color": f.color,
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="feature-icon-wrap">
                  <span className="feature-emoji">{f.icon}</span>
                  <div
                    className="feature-icon-glow"
                    style={{ background: f.color }}
                  />
                </div>
                <h3>{f.label}</h3>
                <p>{f.desc}</p>
                <div
                  className="feature-accent-bar"
                  style={{ background: f.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — REDESIGNED ── */}
      <section className="section how-it-works" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag section-tag--green">Process</span>
            <h2>Ready in 15 Minutes</h2>
            <p>
              Four clear steps from a blank page to a job-ready, ATS-optimized
              PDF.
            </p>
          </div>
          <div className="steps-wrap">
            <div className="steps-connector-line" />
            <div className="steps-grid-new">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="step-new"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div
                    className="step-bubble"
                    style={{ "--step-color": s.color }}
                    data-num={s.step}
                  >
                    <span className="step-emoji-lg">{s.icon}</span>
                    <span className="step-badge">{s.step}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TEMPLATES — REDESIGNED ── */}
      <section className="section templates-preview" id="templates">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Templates</span>
            <h2>Premium ATS-Optimized Templates</h2>
            <p>
              Modern, Minimal, Professional, Executive, and more.
            </p>
          </div>
          <div className="template-grid-new">
            {TEMPLATES.map((tpl) => {
              const PreviewSVG = TemplatePreviews[tpl.previewType];
              return (
                <button
                  key={tpl.name}
                  className="template-card-new"
                  onClick={() =>
                    user ? navigate("/builder") : setShowLoginModal(true)
                  }
                >
                  <div className="tpl-thumb-wrap">
                    <div className="tpl-thumb-inner">
                      <PreviewSVG />
                    </div>
                    <div className="tpl-overlay">
                      <span>Preview →</span>
                    </div>
                  </div>
                  <div className="tpl-footer-new">
                    <strong>{tpl.name}</strong>
                    <span className="tpl-badge-new">{tpl.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="template-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={() =>
                user ? navigate("/builder") : setShowLoginModal(true)
              }
            >
              Browse All Templates
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS — REDESIGNED ── */}
      <section className="section testimonials" id="testimonials">
        <div className="container">
          <div className="section-header">
            <span className="section-tag section-tag--violet">
              Success Stories
            </span>
            <h2>People Are Getting Hired</h2>
            <p>
              Real users, real jobs, real results. Here's what they're saying.
            </p>
          </div>
          <div className="testimonials-grid-new">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="testimonial-card-new"
                style={{ "--accent": t.color, animationDelay: `${i * 70}ms` }}
              >
                <div className="test-stars">★★★★★</div>
                <p className="test-text">"{t.text}"</p>
                <div className="test-author-row">
                  <div
                    className="test-avatar-new"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                    <span className="test-verified">✓</span>
                  </div>
                  <div className="test-author-info">
                    <strong>{t.name}</strong>
                    <span>{t.role}</span>
                    <span className="test-highlight">{t.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-bg">
          <div className="cta-orb cta-orb--1" />
          <div className="cta-orb cta-orb--2" />
          <div className="cta-mesh" />
        </div>
        <div className="container cta-content">
          <div className="cta-eyebrow">
            Start Today — No Credit Card Required
          </div>
          <h2>Your Dream Job is One Resume Away</h2>
          <p>
            Join thousands of professionals who have upgraded their careers with
            ResumeAI.
          </p>
          <button
            className="btn btn-white btn-lg"
            onClick={() =>
              user ? navigate("/builder") : setShowLoginModal(true)
            }
          >
            Build Your Resume Now
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="home-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            ResumeAI
            <span className="footer-sub">Build by CodeSpidey Team</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">Process</a>
            <a href="#templates">Templates</a>
          </div>
          <span className="footer-copy">© 2026 ResumeAI</span>
        </div>
      </footer>

      {/* ── MODALS ── */}
      <ResumeListModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
      />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}

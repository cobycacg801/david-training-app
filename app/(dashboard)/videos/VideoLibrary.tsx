"use client";
import { useState } from "react";
import { canAccess, planLabel, PLAN_PRICE, PLAN_PERKS, PLAN_COLOR } from "@/lib/planUtils";

type Video = {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  category: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  calories: number | null;
  min_plan: string | null;
};

const CATEGORIES = ["All", "Strength", "HIIT", "Mobility", "Cardio", "Recovery"];

const CAT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  strength: { color: "#00f2ff", bg: "rgba(0,242,255,0.08)",   border: "rgba(0,242,255,0.25)"  },
  hiit:     { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)"  },
  mobility: { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)" },
  cardio:   { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)" },
  recovery: { color: "#3ecf8e", bg: "rgba(62,207,142,0.08)",  border: "rgba(62,207,142,0.25)" },
};

const getCat = (category: string | null) =>
  CAT_STYLE[category?.toLowerCase() ?? ""] ??
  { color: "#a1a1aa", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" };

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
  if (url.includes("youtube.com/embed/")) return url;
  return url;
}

// ── Upgrade Modal ─────────────────────────────────────────────
function UpgradeModal({
  plan,
  onClose,
}: {
  plan: string;
  onClose: () => void;
}) {
  const color  = PLAN_COLOR[plan] ?? "#8b5cf6";
  const price  = PLAN_PRICE[plan] ?? "";
  const perks  = PLAN_PERKS[plan] ?? [];
  const isElite = plan === "elite";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 420, width: "100%",
          background: "rgba(8,8,8,0.98)",
          border: `0.5px solid ${isElite ? "rgba(139,92,246,0.25)" : "rgba(0,242,255,0.2)"}`,
          borderRadius: 24, padding: "36px 32px",
          textAlign: "center",
          boxShadow: `0 0 80px ${isElite ? "rgba(139,92,246,0.06)" : "rgba(0,242,255,0.05)"}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Lock icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `rgba(${isElite ? "139,92,246" : "0,242,255"},0.08)`,
          border: `0.5px solid ${isElite ? "rgba(139,92,246,0.3)" : "rgba(0,242,255,0.25)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, margin: "0 auto 22px",
        }}>
          🔒
        </div>

        <h2 style={{ fontSize: 21, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          {planLabel(plan)} Plan Required
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 6, lineHeight: 1.5 }}>
          This video is exclusive to {planLabel(plan)} members.
        </p>
        <p style={{ fontSize: 28, fontWeight: 900, color, marginBottom: 28 }}>
          {price}
        </p>

        {/* Perks */}
        <div style={{ textAlign: "left", marginBottom: 28 }}>
          {perks.map((perk, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: color, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: "#d4d4d8" }}>{perk}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/#pricing"
          style={{
            display: "block", padding: "14px 0", borderRadius: 12,
            background: isElite
              ? "linear-gradient(135deg,rgba(139,92,246,0.18),rgba(139,92,246,0.28))"
              : "linear-gradient(135deg,rgba(0,242,255,0.08),rgba(0,242,255,0.18))",
            border: `0.5px solid ${isElite ? "rgba(139,92,246,0.45)" : "rgba(0,242,255,0.4)"}`,
            fontSize: 14, fontWeight: 800, color,
            textDecoration: "none", marginBottom: 12,
            transition: "opacity 0.2s",
          }}
        >
          Upgrade to {planLabel(plan)} →
        </a>

        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", background: "transparent",
            border: "none", fontSize: 13, color: "#52525b",
            cursor: "pointer",
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function VideoLibrary({
  videos,
  userPlan,
}: {
  videos: Video[];
  userPlan: string;
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [upgradePlan, setUpgradePlan] = useState<string | null>(null);

  const filtered =
    activeCategory === "All"
      ? videos
      : videos.filter(v => v.category?.toLowerCase() === activeCategory.toLowerCase());

  const embedUrl = selectedVideo ? getYouTubeEmbedUrl(selectedVideo.video_url) : null;

  const handleCardClick = (video: Video) => {
    if (!canAccess(userPlan, video.min_plan)) {
      setUpgradePlan(video.min_plan ?? "pro");
    } else {
      setSelectedVideo(video);
    }
  };

  // Count locked videos
  const lockedCount = videos.filter(v => !canAccess(userPlan, v.min_plan)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            Workout{" "}
            <span style={{
              background: "linear-gradient(135deg,#00f2ff,#8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Videos</span>
          </h1>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>
            {videos.length} workout{videos.length !== 1 ? "s" : ""} · Coach David
            {lockedCount > 0 && (
              <span style={{ color: "#52525b" }}> · {lockedCount} locked</span>
            )}
          </p>
        </div>

        {/* Plan badge */}
        <div style={{
          background: userPlan === "elite" ? "rgba(139,92,246,0.1)" : "rgba(0,242,255,0.07)",
          border: `0.5px solid ${userPlan === "elite" ? "rgba(139,92,246,0.3)" : "rgba(0,242,255,0.2)"}`,
          borderRadius: 20, padding: "5px 14px",
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          color: PLAN_COLOR[userPlan] ?? "#a1a1aa",
          textTransform: "uppercase" as const,
        }}>
          {planLabel(userPlan)} Plan
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const style = cat === "All" ? null : CAT_STYLE[cat.toLowerCase()];
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "7px 16px", borderRadius: 20,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: "0.5px solid", transition: "all 0.2s",
                background: isActive
                  ? (style ? style.bg : "rgba(0,242,255,0.08)")
                  : "rgba(255,255,255,0.02)",
                borderColor: isActive
                  ? (style ? style.border : "rgba(0,242,255,0.3)")
                  : "rgba(255,255,255,0.08)",
                color: isActive ? (style ? style.color : "#00f2ff") : "#a1a1aa",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <div
            style={{
              width: "100%", maxWidth: 820,
              background: "rgba(10,10,10,0.95)",
              border: "0.5px solid rgba(0,242,255,0.15)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 0 80px rgba(0,242,255,0.08)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Player */}
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                />
              ) : (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 12,
                  background: "linear-gradient(135deg,rgba(0,242,255,0.04),rgba(139,92,246,0.04))",
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(0,242,255,0.1)", border: "0.5px solid rgba(0,242,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                  }}>▶</div>
                  <p style={{ fontSize: 13, color: "#a1a1aa" }}>Video coming soon</p>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: "20px 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>
                  {selectedVideo.title}
                </h2>
                <button
                  onClick={() => setSelectedVideo(null)}
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#a1a1aa",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >✕ Close</button>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {selectedVideo.category && (() => {
                  const s = getCat(selectedVideo.category);
                  return (
                    <span style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: s.color }}>
                      {selectedVideo.category}
                    </span>
                  );
                })()}
                {selectedVideo.duration && (
                  <span style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#a1a1aa" }}>
                    ⏱ {selectedVideo.duration}
                  </span>
                )}
                {selectedVideo.calories && (
                  <span style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#a1a1aa" }}>
                    🔥 {selectedVideo.calories} kcal
                  </span>
                )}
              </div>
              {selectedVideo.description && (
                <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE MODAL */}
      {upgradePlan && (
        <UpgradeModal plan={upgradePlan} onClose={() => setUpgradePlan(null)} />
      )}

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No videos yet</p>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>
            {activeCategory === "All"
              ? "Coach David will upload workouts here soon."
              : `No ${activeCategory} videos yet. Check back soon.`}
          </p>
        </div>
      )}

      {/* VIDEO GRID */}
      {filtered.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {filtered.map(video => {
            const cat     = getCat(video.category);
            const locked  = !canAccess(userPlan, video.min_plan);
            const reqPlan = video.min_plan ?? "pro";

            return (
              <div
                key={video.id}
                onClick={() => handleCardClick(video)}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, overflow: "hidden",
                  cursor: "pointer", transition: "all 0.25s",
                  opacity: locked ? 0.85 : 1,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = "translateY(-3px)";
                  el.style.borderColor = locked ? "rgba(139,92,246,0.3)" : cat.border;
                  el.style.boxShadow  = locked
                    ? "0 8px 32px rgba(139,92,246,0.08)"
                    : `0 8px 32px ${cat.bg}`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform   = "translateY(0)";
                  el.style.borderColor = "rgba(255,255,255,0.07)";
                  el.style.boxShadow   = "none";
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  position: "relative", paddingTop: "56.25%",
                  background: locked
                    ? "linear-gradient(135deg,rgba(139,92,246,0.06),rgba(0,0,0,0.5))"
                    : `linear-gradient(135deg, ${cat.bg}, rgba(0,0,0,0.4))`,
                  overflow: "hidden",
                }}>
                  {video.thumbnail_url && !locked && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {video.thumbnail_url && locked && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px) brightness(0.35)" }}
                    />
                  )}

                  {/* Lock overlay */}
                  {locked ? (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 2,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: "50%",
                        background: "rgba(139,92,246,0.12)",
                        border: "0.5px solid rgba(139,92,246,0.4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>🔒</div>
                      <span style={{
                        background: "rgba(139,92,246,0.2)",
                        border: "0.5px solid rgba(139,92,246,0.45)",
                        borderRadius: 20, padding: "3px 10px",
                        fontSize: 9, fontWeight: 800, letterSpacing: 1,
                        color: "#8b5cf6", textTransform: "uppercase",
                      }}>
                        {planLabel(reqPlan)} Required
                      </span>
                    </div>
                  ) : (
                    /* Play button overlay */
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(0,0,0,0.2)",
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "rgba(0,0,0,0.6)", border: `1px solid ${cat.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(4px)",
                      }}>
                        <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                          <path d="M1 1l12 7-12 7V1z" fill={cat.color} />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Duration badge */}
                  {video.duration && (
                    <div style={{
                      position: "absolute", bottom: 8, right: 8, zIndex: 3,
                      background: "rgba(0,0,0,0.75)", borderRadius: 6,
                      padding: "2px 7px", fontSize: 10, fontWeight: 600, color: "#fff",
                      backdropFilter: "blur(4px)",
                    }}>
                      {video.duration}
                    </div>
                  )}
                </div>

                {/* Card info */}
                <div style={{ padding: "14px 16px 16px", opacity: locked ? 0.5 : 1 }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: "#fff",
                    marginBottom: 8, lineHeight: 1.4,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {video.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {video.category && (
                        <span style={{
                          background: cat.bg, border: `0.5px solid ${cat.border}`,
                          borderRadius: 20, padding: "2px 8px",
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                          textTransform: "uppercase", color: cat.color,
                        }}>
                          {video.category}
                        </span>
                      )}
                    </div>
                    {video.calories && (
                      <span style={{ fontSize: 11, color: "#52525b", fontWeight: 500 }}>
                        🔥 {video.calories} kcal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

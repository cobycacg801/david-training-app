import { createClient, createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

const G = "#c9a84c";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = createServiceClient();

  const [
    { data: profile },
    { data: membership },
    { data: videos },
    { data: recipes },
    { data: nextBooking },
  ] = await Promise.all([
    db.from("profiles").select("full_name").eq("id", user!.id).single(),
    db.from("memberships").select("plan, status").eq("user_id", user!.id).single(),
    db.from("videos").select("id, title, duration, category, calories").eq("published", true).order("created_at", { ascending: false }).limit(6),
    db.from("recipes").select("id, title, category, calories, prep_time, image_url").eq("published", true).order("created_at", { ascending: false }).limit(3),
    db.from("bookings").select("session_type, scheduled_at, status").eq("user_id", user!.id).eq("status", "confirmed").gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const firstName  = profile?.full_name?.split(" ")[0] || "Champ";
  const plan       = membership?.plan ?? "base";
  const isElite    = plan === "elite";

  const nextSession = nextBooking ? {
    type: nextBooking.session_type,
    date: new Date(nextBooking.scheduled_at).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    time: new Date(nextBooking.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  } : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── ROW 1: Welcome Banner + Right Widgets ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "stretch" }}>

        {/* Welcome Banner */}
        <div style={{
          position: "relative", borderRadius: 20, overflow: "hidden",
          border: "0.5px solid rgba(201,168,76,0.15)",
          minHeight: 240,
        }}>
          {/* Background photo */}
          <Image
            src="/david.jpg"
            alt="Coach David"
            fill
            style={{ objectFit: "cover", objectPosition: "center top" }}
            priority
          />
          {/* Dark overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.55) 55%, rgba(8,8,8,0.35) 100%)",
          }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, padding: "28px 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: G, letterSpacing: 2, marginBottom: 6 }}>
                WELCOME BACK, {firstName.toUpperCase()}
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>
                Welcome to David Training
              </h2>
              <p style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 24 }}>
                Your elite journey starts here.
              </p>

              {/* Play button */}
              <Link href="/videos" style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(201,168,76,0.12)", border: "0.5px solid rgba(201,168,76,0.3)",
                borderRadius: 50, padding: "10px 20px 10px 10px",
                textDecoration: "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: "#080808", fontWeight: 900,
                }}>▶</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Start Today&apos;s Workout</span>
              </Link>
            </div>

            {/* Video progress bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase" }}>
                  VIDEO PROGRESS
                </span>
                <span style={{ fontSize: 10, color: "#71717a" }}>
                  {videos ? `${Math.min(videos.length, 3)} / ${videos.length}` : "0 / 0"} watched this week
                </span>
              </div>
              <div style={{
                height: 3, borderRadius: 4,
                background: "rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  height: "100%", borderRadius: 4,
                  background: `linear-gradient(90deg, ${G}, #e8d5a3)`,
                  width: videos?.length ? `${Math.min(50, 100)}%` : "30%",
                  transition: "width 0.6s",
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Upload Progress */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 18, padding: "20px",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
                  UPLOAD PROGRESS
                </div>
                <div style={{ fontSize: 11, color: "#71717a" }}>Your progress this week</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
              {/* SVG Ring */}
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke={G} strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - 0.78)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 36 36)"
                />
                <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="900" fontFamily="Inter,sans-serif">78%</text>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Great work!</div>
                <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5 }}>Keep uploading your progress photos</div>
              </div>
            </div>
            <Link href="/progress" style={{
              marginTop: 14, padding: "8px", borderRadius: 10, textAlign: "center",
              background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.18)",
              fontSize: 11, fontWeight: 700, color: G, textDecoration: "none",
            }}>
              View Details
            </Link>
          </div>

          {/* Schedule */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 18, padding: "20px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
              SCHEDULE
            </div>
            {nextSession ? (
              <>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Next Session</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{nextSession.type}</div>
                <div style={{ fontSize: 11, color: G }}>{nextSession.date} · {nextSession.time}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>No upcoming session</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Book your next session</div>
              </>
            )}
            <Link href="/schedule" style={{
              display: "block", marginTop: 14, padding: "8px", borderRadius: 10, textAlign: "center",
              background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.18)",
              fontSize: 11, fontWeight: 700, color: G, textDecoration: "none",
            }}>
              View Full Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Group Chat + Routine Videos ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Group Chat */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>GROUP CHAT</span>
            </div>
            <div style={{
              background: "rgba(201,168,76,0.15)", border: "0.5px solid rgba(201,168,76,0.3)",
              borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: G,
            }}>LIVE</div>
          </div>

          {/* Mock messages */}
          {[
            { name: "Alex M.", msg: "Who's joining the 6am session?", time: "5:45 AM" },
            { name: "Sofia K.", msg: "I'll be there! Count me in 💪", time: "5:46 AM" },
          ].map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "rgba(201,168,76,0.12)", border: "0.5px solid rgba(201,168,76,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: G,
              }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{m.name}</span>
                  <span style={{ fontSize: 10, color: "#52525b" }}>{m.time}</span>
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>{m.msg}</div>
              </div>
            </div>
          ))}

          <Link href="/chat" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "#52525b", textDecoration: "none",
          }}>
            <span style={{ flex: 1 }}>Message the group...</span>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#080808", fontWeight: 900,
            }}>→</div>
          </Link>
        </div>

        {/* Routine Videos */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>▶</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>ROUTINE VIDEOS</span>
            </div>
            <Link href="/videos" style={{ fontSize: 11, color: G, textDecoration: "none", fontWeight: 600 }}>See all →</Link>
          </div>

          {videos && videos.length > 0 ? videos.slice(0, 5).map((v) => (
            <div key={v.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderBottom: "0.5px solid rgba(255,255,255,0.04)",
            }}>
              {/* Thumbnail placeholder */}
              <div style={{
                width: 44, height: 32, borderRadius: 7, flexShrink: 0,
                background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: G,
              }}>▶</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v.title}
                </div>
                <div style={{ fontSize: 10, color: "#71717a", marginTop: 1 }}>
                  {v.calories && `${v.calories} kcal`}{v.calories && v.duration && " · "}{v.duration && v.duration}
                </div>
              </div>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: "#71717a",
              }}>▶</div>
            </div>
          )) : (
            <div style={{ fontSize: 12, color: "#52525b", textAlign: "center", padding: "20px 0" }}>
              No videos available yet
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Private Chat (Elite) ──────────────────────────────── */}
      {isElite && (
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(201,168,76,0.18)",
          borderRadius: 18, padding: "20px", display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>💬</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>PRIVATE CHAT</span>
            </div>
            <div style={{
              background: "rgba(62,207,142,0.12)", border: "0.5px solid rgba(62,207,142,0.3)",
              borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#3ecf8e",
            }}>ONLINE</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))`,
              border: "0.5px solid rgba(201,168,76,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, color: G,
            }}>D</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Coach David</span>
                <span style={{ fontSize: 10, color: "#52525b" }}>Today</span>
              </div>
              <div style={{ fontSize: 12, color: "#a1a1aa" }}>
                Your form is improving. Review today&apos;s drill.
              </div>
            </div>
          </div>

          <Link href="/chat" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "#52525b", textDecoration: "none",
          }}>
            <span style={{ flex: 1 }}>Type a message...</span>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: `linear-gradient(135deg, ${G}, #e8d5a3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#080808", fontWeight: 900,
            }}>→</div>
          </Link>
        </div>
      )}

      {/* ── ROW 4: Healthy Recipes ────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>🥗</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>HEALTHY RECIPES</span>
          </div>
          <Link href="/nutrition" style={{ fontSize: 11, color: G, textDecoration: "none", fontWeight: 600 }}>See all →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {recipes && recipes.length > 0 ? recipes.map((r) => (
            <Link key={r.id} href="/nutrition" style={{
              background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 16, overflow: "hidden", textDecoration: "none",
              display: "flex", flexDirection: "column",
              transition: "all 0.2s",
            }}>
              {/* Recipe image or placeholder */}
              <div style={{
                height: 110, background: "rgba(201,168,76,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, position: "relative",
              }}>
                {r.image_url ? (
                  <Image src={r.image_url} alt={r.title} fill style={{ objectFit: "cover" }} />
                ) : (
                  <span>🥗</span>
                )}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10,
                }}>🔖</div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{
                  display: "inline-block", fontSize: 8, fontWeight: 800, letterSpacing: 1,
                  color: G, background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.2)",
                  borderRadius: 4, padding: "2px 6px", marginBottom: 6, textTransform: "uppercase",
                }}>
                  {r.category || "RECIPE"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6, lineHeight: 1.3 }}>
                  {r.title}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#71717a" }}>{r.calories && `${r.calories} kcal`}</span>
                  <span style={{ fontSize: 11, color: "#71717a" }}>{r.prep_time && `⏱ ${r.prep_time} min`}</span>
                </div>
              </div>
            </Link>
          )) : (
            /* Placeholder recipe cards if no recipes yet */
            [
              { title: "Protein Power Bowl", cat: "HIGH PROTEIN", kcal: 520, time: 15 },
              { title: "Green Recovery Shake", cat: "RECOVERY", kcal: 280, time: 5 },
              { title: "Oat Power Pancakes", cat: "PRE-WORKOUT", kcal: 440, time: 20 },
            ].map((r, i) => (
              <Link key={i} href="/nutrition" style={{
                background: "rgba(255,255,255,0.025)", border: "0.5px solid rgba(255,255,255,0.07)",
                borderRadius: 16, overflow: "hidden", textDecoration: "none",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{
                  height: 110, background: "rgba(201,168,76,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
                  position: "relative",
                }}>
                  <span>{["🥗", "🥤", "🥞"][i]}</span>
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 24, height: 24, borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", border: "0.5px solid rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10,
                  }}>🔖</div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{
                    display: "inline-block", fontSize: 8, fontWeight: 800, letterSpacing: 1,
                    color: G, background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.2)",
                    borderRadius: 4, padding: "2px 6px", marginBottom: 6, textTransform: "uppercase",
                  }}>{r.cat}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{r.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#71717a" }}>{r.kcal} kcal</span>
                    <span style={{ fontSize: 11, color: "#71717a" }}>⏱ {r.time} min</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

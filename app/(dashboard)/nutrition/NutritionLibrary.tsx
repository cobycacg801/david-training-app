"use client";
import { useState } from "react";
import { canAccess, planLabel, PLAN_PRICE, PLAN_PERKS, PLAN_COLOR } from "@/lib/planUtils";

type Recipe = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  calories: number | null;
  prep_time: string | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  image_url: string | null;
  min_plan: string | null;
};

const TABS = ["Recipes", "Meal Plans"];
const CATEGORIES = ["All", "High-Protein", "Recovery", "Pre-Workout", "Meal-Plan"];

const CAT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "high-protein": { color: "#00f2ff", bg: "rgba(0,242,255,0.08)",  border: "rgba(0,242,255,0.25)"  },
  "recovery":     { color: "#3ecf8e", bg: "rgba(62,207,142,0.08)", border: "rgba(62,207,142,0.25)" },
  "pre-workout":  { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  "meal-plan":    { color: "#8b5cf6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
};

const getCat = (cat: string | null) =>
  CAT_STYLE[cat?.toLowerCase() ?? ""] ??
  { color: "#a1a1aa", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" };

const MEAL_PLANS = [
  {
    name: "Muscle Building",
    minPlan: "pro",
    tag: "Pro",
    tagColor: "#8b5cf6",
    days: 7,
    calories: "3,200 kcal/day",
    desc: "High-protein, high-calorie plan designed for maximum muscle growth. 6 meals per day with strategic carb timing.",
    meals: ["Oat Power Pancakes + Protein Shake", "Chicken Rice Bowl + Greens", "Protein Power Bowl", "Greek Yogurt + Nuts", "Salmon + Sweet Potato", "Casein Protein + Almond Butter"],
    color: "#8b5cf6", bg: "rgba(139,92,246,0.06)", border: "rgba(139,92,246,0.2)",
  },
  {
    name: "Fat Loss",
    minPlan: "pro",
    tag: "Pro",
    tagColor: "#00f2ff",
    days: 7,
    calories: "1,800 kcal/day",
    desc: "Calorie-controlled plan focused on fat loss while preserving lean muscle. High protein, moderate carbs, strategic fasting window.",
    meals: ["Green Recovery Shake", "Egg White Omelette + Veggies", "Tuna Salad Bowl", "Apple + Almond Butter", "Grilled Chicken + Broccoli", "Protein Shake"],
    color: "#00f2ff", bg: "rgba(0,242,255,0.04)", border: "rgba(0,242,255,0.15)",
  },
  {
    name: "Performance",
    minPlan: "elite",
    tag: "Elite",
    tagColor: "#f59e0b",
    days: 7,
    calories: "2,800 kcal/day",
    desc: "David's personal performance nutrition plan. Optimized for athletes training twice a day. Carb periodization included.",
    meals: ["Oat Power Pancakes + Banana", "Pre-Workout Smoothie", "Protein Power Bowl + Rice", "Post-Workout Shake + Fruit", "Salmon + Quinoa + Greens", "Cottage Cheese + Berries"],
    color: "#f59e0b", bg: "rgba(245,158,11,0.04)", border: "rgba(245,158,11,0.15)",
  },
];

// ── Upgrade Modal ─────────────────────────────────────────────
function UpgradeModal({ plan, onClose }: { plan: string; onClose: () => void }) {
  const color   = PLAN_COLOR[plan] ?? "#8b5cf6";
  const price   = PLAN_PRICE[plan] ?? "";
  const perks   = PLAN_PERKS[plan] ?? [];
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
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: `rgba(${isElite ? "139,92,246" : "0,242,255"},0.08)`,
          border: `0.5px solid ${isElite ? "rgba(139,92,246,0.3)" : "rgba(0,242,255,0.25)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, margin: "0 auto 22px",
        }}>🔒</div>

        <h2 style={{ fontSize: 21, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
          {planLabel(plan)} Plan Required
        </h2>
        <p style={{ fontSize: 13, color: "#71717a", marginBottom: 6, lineHeight: 1.5 }}>
          This content is exclusive to {planLabel(plan)} members.
        </p>
        <p style={{ fontSize: 28, fontWeight: 900, color, marginBottom: 28 }}>
          {price}
        </p>

        <div style={{ textAlign: "left", marginBottom: 28 }}>
          {perks.map((perk, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#d4d4d8" }}>{perk}</span>
            </div>
          ))}
        </div>

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
          }}
        >
          Upgrade to {planLabel(plan)} →
        </a>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px 0", background: "transparent", border: "none", fontSize: 13, color: "#52525b", cursor: "pointer" }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function NutritionLibrary({
  recipes,
  userPlan,
}: {
  recipes: Recipe[];
  userPlan: string;
}) {
  const [activeTab, setActiveTab] = useState("Recipes");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [upgradePlan, setUpgradePlan] = useState<string | null>(null);

  const filtered =
    activeCategory === "All"
      ? recipes
      : recipes.filter(r => r.category?.toLowerCase() === activeCategory.toLowerCase());

  const handleRecipeClick = (recipe: Recipe) => {
    if (!canAccess(userPlan, recipe.min_plan)) {
      setUpgradePlan(recipe.min_plan ?? "pro");
    } else {
      setSelectedRecipe(recipe);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
            <span style={{
              background: "linear-gradient(135deg,#00f2ff,#8b5cf6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>Nutrition</span>
          </h1>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>
            Recipes, meal plans and macros designed by Coach David
          </p>
        </div>
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

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", background: "transparent",
              color: activeTab === tab ? "#fff" : "#a1a1aa",
              borderBottom: activeTab === tab ? "2px solid #00f2ff" : "2px solid transparent",
              transition: "all 0.2s", marginBottom: -1,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {tab}
            {tab === "Meal Plans" && !canAccess(userPlan, "pro") && (
              <span style={{
                fontSize: 9, background: "rgba(139,92,246,0.15)",
                border: "0.5px solid rgba(139,92,246,0.3)",
                borderRadius: 10, padding: "1px 6px",
                color: "#8b5cf6", fontWeight: 700, letterSpacing: 0.5,
              }}>PRO</span>
            )}
          </button>
        ))}
      </div>

      {/* ── RECIPES TAB ── */}
      {activeTab === "Recipes" && (
        <>
          {/* Category filters */}
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
                    background: isActive ? (style?.bg ?? "rgba(0,242,255,0.08)") : "rgba(255,255,255,0.02)",
                    borderColor: isActive ? (style?.border ?? "rgba(0,242,255,0.3)") : "rgba(255,255,255,0.08)",
                    color: isActive ? (style?.color ?? "#00f2ff") : "#a1a1aa",
                  }}
                >{cat}</button>
              );
            })}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🥗</div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No recipes yet</p>
              <p style={{ fontSize: 13, color: "#a1a1aa" }}>Coach David will add recipes here soon.</p>
            </div>
          )}

          {/* Recipe grid */}
          {filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {filtered.map(recipe => {
                const cat    = getCat(recipe.category);
                const locked = !canAccess(userPlan, recipe.min_plan);
                const reqPlan = recipe.min_plan ?? "pro";

                return (
                  <div
                    key={recipe.id}
                    onClick={() => handleRecipeClick(recipe)}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "0.5px solid rgba(255,255,255,0.07)",
                      borderRadius: 16, overflow: "hidden",
                      cursor: "pointer", transition: "all 0.25s",
                      opacity: locked ? 0.8 : 1,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(-3px)";
                      el.style.borderColor = locked ? "rgba(139,92,246,0.3)" : cat.border;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = "translateY(0)";
                      el.style.borderColor = "rgba(255,255,255,0.07)";
                    }}
                  >
                    {/* Image / placeholder */}
                    <div style={{
                      height: 110, position: "relative", overflow: "hidden",
                      background: locked
                        ? "linear-gradient(135deg,rgba(139,92,246,0.06),rgba(0,0,0,0.5))"
                        : `linear-gradient(135deg, ${cat.bg}, rgba(0,0,0,0.3))`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 36,
                    }}>
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            filter: locked ? "blur(3px) brightness(0.35)" : "none",
                          }}
                        />
                      ) : (
                        <span style={{ opacity: locked ? 0.3 : 1 }}>🥗</span>
                      )}

                      {locked && (
                        <div style={{
                          position: "absolute", inset: 0, zIndex: 2,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", gap: 6,
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "rgba(139,92,246,0.12)",
                            border: "0.5px solid rgba(139,92,246,0.4)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16,
                          }}>🔒</div>
                          <span style={{
                            background: "rgba(139,92,246,0.2)",
                            border: "0.5px solid rgba(139,92,246,0.45)",
                            borderRadius: 20, padding: "2px 8px",
                            fontSize: 8, fontWeight: 800, letterSpacing: 1,
                            color: "#8b5cf6", textTransform: "uppercase",
                          }}>
                            {planLabel(reqPlan)} Required
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: "14px 16px 16px", opacity: locked ? 0.5 : 1 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>
                        {recipe.title}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        {recipe.category && (
                          <span style={{
                            background: cat.bg, border: `0.5px solid ${cat.border}`,
                            borderRadius: 20, padding: "2px 8px",
                            fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                            textTransform: "uppercase", color: cat.color,
                          }}>{recipe.category}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        {recipe.calories && <span style={{ fontSize: 11, color: "#52525b" }}>🔥 {recipe.calories} kcal</span>}
                        {recipe.prep_time && <span style={{ fontSize: 11, color: "#52525b" }}>⏱ {recipe.prep_time}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── MEAL PLANS TAB ── */}
      {activeTab === "Meal Plans" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MEAL_PLANS.map(plan => {
            const locked  = !canAccess(userPlan, plan.minPlan);
            const planClr = PLAN_COLOR[plan.minPlan] ?? "#8b5cf6";

            return (
              <div key={plan.name} style={{
                background: plan.bg, border: `0.5px solid ${locked ? "rgba(139,92,246,0.15)" : plan.border}`,
                borderRadius: 20, overflow: "hidden", position: "relative",
              }}>
                {/* Plan content (blurred when locked) */}
                <div style={{
                  padding: "22px 24px",
                  filter: locked ? "blur(2px) brightness(0.4)" : "none",
                  pointerEvents: locked ? "none" : "auto",
                  userSelect: locked ? "none" : "auto",
                  transition: "filter 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{plan.name} Plan</h3>
                        <span style={{
                          background: `rgba(${plan.tagColor === "#8b5cf6" ? "139,92,246" : plan.tagColor === "#00f2ff" ? "0,242,255" : "245,158,11"},0.15)`,
                          border: `0.5px solid ${plan.tagColor}40`,
                          borderRadius: 20, padding: "2px 10px",
                          fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase",
                          color: plan.tagColor,
                        }}>{plan.tag}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#a1a1aa", maxWidth: 500, lineHeight: 1.6 }}>{plan.desc}</p>
                    </div>
                    <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: plan.color }}>{plan.days}</div>
                        <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, letterSpacing: 0.5 }}>DAYS</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: plan.color }}>{plan.calories}</div>
                        <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, letterSpacing: 0.5 }}>TARGET</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#52525b", marginBottom: 10 }}>
                      Sample Daily Meals
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
                      {plan.meals.map((meal, i) => (
                        <div key={i} style={{
                          background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)",
                          borderRadius: 10, padding: "9px 12px",
                          display: "flex", alignItems: "center", gap: 8,
                        }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                            background: `rgba(${plan.tagColor === "#8b5cf6" ? "139,92,246" : plan.tagColor === "#00f2ff" ? "0,242,255" : "245,158,11"},0.12)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 800, color: plan.color,
                          }}>{i + 1}</span>
                          <span style={{ fontSize: 12, color: "#e4e4e7", lineHeight: 1.3 }}>{meal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Lock overlay on top of plan card */}
                {locked && (
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 10,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 12,
                    padding: 24,
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: `rgba(${plan.minPlan === "elite" ? "139,92,246" : "0,242,255"},0.1)`,
                      border: `0.5px solid ${planClr}50`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24,
                    }}>🔒</div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                        {plan.name} Plan
                      </p>
                      <p style={{ fontSize: 12, color: "#71717a", marginBottom: 14 }}>
                        Requires {planLabel(plan.minPlan)} membership · {PLAN_PRICE[plan.minPlan]}
                      </p>
                    </div>
                    <a
                      href="/#pricing"
                      style={{
                        padding: "11px 28px", borderRadius: 12,
                        background: plan.minPlan === "elite"
                          ? "linear-gradient(135deg,rgba(139,92,246,0.2),rgba(139,92,246,0.32))"
                          : "linear-gradient(135deg,rgba(0,242,255,0.1),rgba(0,242,255,0.22))",
                        border: `0.5px solid ${planClr}60`,
                        fontSize: 13, fontWeight: 800, color: planClr,
                        textDecoration: "none",
                      }}
                    >
                      Upgrade to {planLabel(plan.minPlan)} →
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── UPGRADE MODAL (recipe click) ── */}
      {upgradePlan && (
        <UpgradeModal plan={upgradePlan} onClose={() => setUpgradePlan(null)} />
      )}

      {/* ── RECIPE DETAIL MODAL ── */}
      {selectedRecipe && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setSelectedRecipe(null)}
        >
          <div
            style={{ width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", background: "rgba(10,10,10,0.98)", border: "0.5px solid rgba(0,242,255,0.15)", borderRadius: 20, padding: 28 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 8 }}>{selectedRecipe.title}</h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selectedRecipe.category && (() => {
                    const s = getCat(selectedRecipe.category);
                    return <span style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: s.color }}>{selectedRecipe.category}</span>;
                  })()}
                  {selectedRecipe.calories && <span style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#a1a1aa" }}>🔥 {selectedRecipe.calories} kcal</span>}
                  {selectedRecipe.prep_time && <span style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 600, color: "#a1a1aa" }}>⏱ {selectedRecipe.prep_time}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedRecipe(null)} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", fontSize: 12, color: "#a1a1aa", cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>

            {selectedRecipe.description && (
              <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 20 }}>{selectedRecipe.description}</p>
            )}

            <div style={{ display: "grid", gridTemplateColumns: selectedRecipe.ingredients ? "1fr 1fr" : "1fr", gap: 20 }}>
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#52525b", marginBottom: 12 }}>Ingredients</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00f2ff", flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#e4e4e7" }}>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#52525b", marginBottom: 12 }}>Instructions</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(0,242,255,0.1)", border: "0.5px solid rgba(0,242,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#00f2ff", flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5, paddingTop: 3 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

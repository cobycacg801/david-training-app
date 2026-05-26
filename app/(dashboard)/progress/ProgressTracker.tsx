"use client";
import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Upload = {
  id: string;
  file_url: string;
  file_type: string | null;
  note: string | null;
  created_at: string;
};

export default function ProgressTracker({
  uploads: initialUploads,
  userId,
}: {
  uploads: Upload[];
  userId: string;
}) {
  const [uploads, setUploads] = useState<Upload[]>(initialUploads);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lightbox, setLightbox] = useState<Upload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File selection ──────────────────────────────────────────
  const handleFile = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum size is 50 MB.");
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    setNote("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Upload ──────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setUploadProgress(20);

    try {
      const supabase = createClient();
      const ext = selectedFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;

      setUploadProgress(40);

      const { error: storageError } = await supabase.storage
        .from("progress")
        .upload(path, selectedFile, { upsert: false });

      if (storageError) throw storageError;

      setUploadProgress(70);

      const { data: { publicUrl } } = supabase.storage
        .from("progress")
        .getPublicUrl(path);

      const fileType = selectedFile.type.startsWith("video/") ? "video" : "image";

      const { data: newUpload, error: dbError } = await supabase
        .from("progress_uploads")
        .insert({
          user_id: userId,
          file_url: publicUrl,
          file_type: fileType,
          note: note.trim() || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);
      setUploads(prev => [newUpload, ...prev]);
      setSuccess(true);
      setTimeout(() => {
        clearSelection();
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed. Try again.";
      setError(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Stats ───────────────────────────────────────────────────
  const totalUploads = uploads.length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = uploads.filter(u => new Date(u.created_at) > weekAgo).length;
  const firstUpload = uploads.length > 0
    ? new Date(uploads[uploads.length - 1].created_at)
    : null;
  const daysSince = firstUpload
    ? Math.floor((Date.now() - firstUpload.getTime()) / 86_400_000)
    : 0;

  // ── Group uploads by month ──────────────────────────────────
  const grouped = uploads.reduce<Record<string, Upload[]>>((acc, u) => {
    const key = new Date(u.created_at).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    (acc[key] ??= []).push(u);
    return acc;
  }, {});

  const isVideo = (u: Upload) => u.file_type === "video";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
          Progress{" "}
          <span style={{
            background: "linear-gradient(135deg,#00f2ff,#8b5cf6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Tracker
          </span>
        </h1>
        <p style={{ fontSize: 13, color: "#a1a1aa" }}>
          Document your transformation — photos & videos tell the real story.
        </p>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Total Uploads", value: totalUploads, icon: "📸", color: "#00f2ff" },
          { label: "This Week", value: thisWeek, icon: "⚡", color: "#8b5cf6" },
          { label: "Days Tracking", value: daysSince, icon: "🗓", color: "#3ecf8e" },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: 6,
            }}
          >
            <span style={{ fontSize: 20 }}>{stat.icon}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, letterSpacing: 0.5 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── UPLOAD CARD ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: 24,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
          📤 New Upload
        </h2>

        {!selectedFile ? (
          /* Drop zone */
          <div
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragOver ? "rgba(0,242,255,0.5)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 14, padding: "40px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 10, cursor: "pointer", transition: "all 0.2s",
              background: dragOver ? "rgba(0,242,255,0.04)" : "rgba(255,255,255,0.01)",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(0,242,255,0.08)",
              border: "0.5px solid rgba(0,242,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>📷</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 0 }}>
              {dragOver ? "Drop it here" : "Click or drag a photo / video"}
            </p>
            <p style={{ fontSize: 12, color: "#52525b" }}>
              JPG, PNG, MP4, MOV · Max 50 MB
            </p>
          </div>
        ) : (
          /* Preview + note */
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {/* Thumbnail */}
              <div style={{
                width: 120, height: 120, borderRadius: 12, overflow: "hidden",
                border: "0.5px solid rgba(0,242,255,0.2)",
                background: "#000", flexShrink: 0,
                position: "relative",
              }}>
                {isVideo({ id: "", file_url: preview ?? "", file_type: selectedFile.type.startsWith("video/") ? "video" : "image", note: null, created_at: "" }) ? (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(0,242,255,0.06)", flexDirection: "column", gap: 6,
                  }}>
                    <span style={{ fontSize: 28 }}>🎬</span>
                    <span style={{ fontSize: 10, color: "#a1a1aa" }}>Video</span>
                  </div>
                ) : (
                  preview && (
                    <img
                      src={preview}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )
                )}
              </div>

              {/* File info + note */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#52525b" }}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note… (optional) — weight, measurements, how you feel"
                  rows={3}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.03)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "10px 12px",
                    fontSize: 12, color: "#d4d4d8", outline: "none", resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Progress bar */}
            {uploading && uploadProgress > 0 && (
              <div style={{
                height: 4, background: "rgba(255,255,255,0.06)",
                borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: "linear-gradient(90deg,#00f2ff,#8b5cf6)",
                  width: `${uploadProgress}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.08)",
                border: "0.5px solid rgba(239,68,68,0.25)",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: "#f87171",
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                background: "rgba(62,207,142,0.08)",
                border: "0.5px solid rgba(62,207,142,0.25)",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 12, color: "#3ecf8e",
              }}>
                ✓ Upload complete!
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                  background: uploading
                    ? "rgba(0,242,255,0.05)"
                    : "linear-gradient(135deg,rgba(0,242,255,0.15),rgba(139,92,246,0.15))",
                  border: "0.5px solid rgba(0,242,255,0.3)",
                  fontSize: 13, fontWeight: 700, color: uploading ? "#52525b" : "#00f2ff",
                  cursor: uploading ? "not-allowed" : "pointer", transition: "all 0.2s",
                } as React.CSSProperties}
              >
                {uploading ? `Uploading… ${uploadProgress}%` : "⬆ Upload"}
              </button>
              <button
                onClick={clearSelection}
                disabled={uploading}
                style={{
                  padding: "11px 20px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  fontSize: 13, fontWeight: 600, color: "#71717a",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleInputChange}
        />
      </div>

      {/* ── TIMELINE ── */}
      {uploads.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "rgba(255,255,255,0.02)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            Start your timeline
          </p>
          <p style={{ fontSize: 13, color: "#a1a1aa" }}>
            Upload your first photo or video above. Track every week — the transformation is real.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {Object.entries(grouped).map(([month, items]) => (
            <div key={month}>
              {/* Month header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", letterSpacing: 0.5 }}>
                  {month}
                </span>
                <div style={{ flex: 1, height: "0.5px", background: "rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize: 11, color: "#52525b" }}>
                  {items.length} upload{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Photo grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}>
                {items.map(upload => {
                  const date = new Date(upload.created_at);
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "short", day: "numeric",
                  });
                  const timeStr = date.toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true,
                  });

                  return (
                    <div
                      key={upload.id}
                      onClick={() => setLightbox(upload)}
                      style={{
                        borderRadius: 14, overflow: "hidden",
                        border: "0.5px solid rgba(255,255,255,0.07)",
                        background: "rgba(255,255,255,0.02)",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,242,255,0.25)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,242,255,0.06)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      {/* Image / Video thumb */}
                      <div style={{
                        position: "relative", paddingTop: "100%",
                        background: "rgba(0,0,0,0.4)", overflow: "hidden",
                      }}>
                        {isVideo(upload) ? (
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            gap: 6,
                            background: "linear-gradient(135deg,rgba(0,242,255,0.04),rgba(139,92,246,0.04))",
                          }}>
                            <div style={{
                              width: 44, height: 44, borderRadius: "50%",
                              background: "rgba(0,242,255,0.1)",
                              border: "0.5px solid rgba(0,242,255,0.3)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 18,
                            }}>▶</div>
                            <span style={{ fontSize: 10, color: "#a1a1aa" }}>Video</span>
                          </div>
                        ) : (
                          <img
                            src={upload.file_url}
                            alt={upload.note ?? "Progress photo"}
                            style={{
                              position: "absolute", inset: 0,
                              width: "100%", height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        {/* Date overlay */}
                        <div style={{
                          position: "absolute", bottom: 8, left: 8,
                          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
                          borderRadius: 6, padding: "2px 8px",
                          fontSize: 10, fontWeight: 600, color: "#fff",
                        }}>
                          {dateStr}
                        </div>
                      </div>

                      {/* Note */}
                      {upload.note && (
                        <div style={{ padding: "10px 12px 12px" }}>
                          <p style={{
                            fontSize: 11, color: "#71717a", lineHeight: 1.5,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          } as React.CSSProperties}>
                            {upload.note}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setLightbox(null)}
        >
          <div
            style={{
              maxWidth: 680, width: "100%",
              background: "rgba(10,10,10,0.95)",
              border: "0.5px solid rgba(0,242,255,0.12)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 0 80px rgba(0,242,255,0.06)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Media */}
            {isVideo(lightbox) ? (
              <div style={{
                paddingTop: "56.25%", position: "relative",
                background: "linear-gradient(135deg,rgba(0,242,255,0.04),rgba(139,92,246,0.04))",
              }}>
                <video
                  src={lightbox.file_url}
                  controls
                  autoPlay
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                />
              </div>
            ) : (
              <img
                src={lightbox.file_url}
                alt={lightbox.note ?? "Progress photo"}
                style={{
                  width: "100%", maxHeight: 520,
                  objectFit: "contain", display: "block",
                  background: "#000",
                }}
              />
            )}

            {/* Info */}
            <div style={{ padding: "18px 24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#52525b" }}>
                  {new Date(lightbox.created_at).toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                  {" · "}
                  {new Date(lightbox.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit", hour12: true,
                  })}
                </span>
                <button
                  onClick={() => setLightbox(null)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "5px 12px",
                    fontSize: 12, color: "#a1a1aa", cursor: "pointer",
                  }}
                >
                  ✕ Close
                </button>
              </div>
              {lightbox.note && (
                <p style={{
                  fontSize: 13, color: "#d4d4d8", lineHeight: 1.6,
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, padding: "10px 14px",
                }}>
                  {lightbox.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

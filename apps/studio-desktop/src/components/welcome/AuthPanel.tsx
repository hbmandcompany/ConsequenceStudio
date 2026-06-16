import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@consequence/state";
import { useSessionStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

// "landing" shows just the wordmark + two CTA buttons.
// "signin" / "signup" slide the form into view below the wordmark.
type WelcomeStep = "landing" | "signin" | "signup";

export function AuthPanel() {
  const [step, setStep] = useState<WelcomeStep>("landing");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const setSessionName = useSessionStore((s) => s.setSessionName);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = step === "signin" ? signIn(username, password) : signUp(username, password);
    if (!ok) {
      setError("Enter a username and password.");
      return;
    }
    setSessionName(`${username.trim()}'s Session`);
    navigate("/workspace");
  };

  const goBack = () => {
    setStep("landing");
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <div className="relative z-10 flex flex-col items-center" style={{ width: "100%", maxWidth: 480 }}>
      {/* ── Wordmark ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
        className="text-center"
      >
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(72px, 11vw, 128px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#FFFFFF",
            marginBottom: 0,
          }}
        >
          Consequence
        </h1>
      </motion.div>

      {/* ── Landing CTA buttons ──────────────────────── */}
      <AnimatePresence mode="wait">
        {step === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-10 flex gap-3"
          >
            {/* Sign In is now the primary (left) button */}
            <button
              type="button"
              onClick={() => setStep("signin")}
              style={{
                fontFamily: tokens.typography.fontFamily.ui,
                fontSize: tokens.typography.fontSize.body,
                fontWeight: tokens.typography.fontWeight.medium,
                color: "#000000",
                background: "#FFFFFF",
                border: "none",
                borderRadius: 7,
                padding: "8px 32px",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setStep("signup")}
              style={{
                fontFamily: tokens.typography.fontFamily.ui,
                fontSize: tokens.typography.fontSize.body,
                fontWeight: tokens.typography.fontWeight.medium,
                color: "#FFFFFF",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 7,
                padding: "8px 32px",
                cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Sign Up
            </button>
          </motion.div>
        )}

        {/* ── Auth form ────────────────────────────────── */}
        {(step === "signin" || step === "signup") && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              marginTop: 40,
              width: "100%",
            }}
          >
            <div
              style={{
                background: "rgba(17,17,17,0.72)",
                backdropFilter: "blur(20px)",
                border: `1px solid ${tokens.colors.border.standard}`,
                borderRadius: 14,
                padding: "32px 32px 28px",
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <span
                  style={{
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.heading,
                    fontWeight: tokens.typography.fontWeight.medium,
                    color: tokens.colors.text.primary,
                  }}
                >
                  {step === "signin" ? "Sign in" : "Create account"}
                </span>
                <button
                  type="button"
                  onClick={goBack}
                  style={{
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.compact,
                    color: tokens.colors.text.muted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}
                >
                  ← Back
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  placeholder="Username"
                  style={{
                    width: "100%",
                    backgroundColor: tokens.colors.background.canvas,
                    border: `1px solid ${tokens.colors.border.standard}`,
                    borderRadius: 8,
                    padding: "11px 14px",
                    color: tokens.colors.text.primary,
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.body,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={step === "signin" ? "current-password" : "new-password"}
                  placeholder="Password"
                  style={{
                    width: "100%",
                    backgroundColor: tokens.colors.background.canvas,
                    border: `1px solid ${tokens.colors.border.standard}`,
                    borderRadius: 8,
                    padding: "11px 14px",
                    color: tokens.colors.text.primary,
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.body,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />

                {error && (
                  <p
                    style={{
                      fontSize: tokens.typography.fontSize.sm,
                      color: "#cc4444",
                      fontFamily: tokens.typography.fontFamily.ui,
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  style={{
                    marginTop: 4,
                    width: "100%",
                    backgroundColor: tokens.colors.text.accent,
                    color: tokens.colors.background.canvas,
                    border: "none",
                    borderRadius: 8,
                    padding: "12px",
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.body,
                    fontWeight: tokens.typography.fontWeight.medium,
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {step === "signin" ? "Continue" : "Create account"}
                </button>
              </form>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(step === "signin" ? "signup" : "signin");
                    setError("");
                  }}
                  style={{
                    fontFamily: tokens.typography.fontFamily.ui,
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.colors.text.muted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {step === "signin"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ──────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          marginTop: step === "landing" ? 48 : 24,
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.fontFamily.ui,
          letterSpacing: "0.01em",
        }}
      >
        HBM &amp; Company
      </motion.p>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@consequence/state";
import { useSessionStore } from "@consequence/state";
import { tokens } from "@consequence/ui/design-system";

type AuthMode = "signin" | "signup";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("signin");
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
    const ok = mode === "signin" ? signIn(username, password) : signUp(username, password);
    if (!ok) {
      setError("Enter a username and password.");
      return;
    }
    setSessionName(`${username.trim()}'s Session`);
    navigate("/workspace");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
      className="relative z-10 w-full max-w-[380px] rounded-xl border p-8 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(26, 26, 26, 0.75)",
        borderColor: tokens.colors.border.active,
        boxShadow: `${tokens.colors.shadow.modal}, 0 0 60px rgba(58, 74, 122, 0.15)`,
      }}
    >
      <div className="mb-8 text-center">
        <h1
          className="mb-2 font-medium text-white"
          style={{
            fontFamily: tokens.typography.fontFamily.ui,
            fontSize: tokens.typography.fontSize.display,
            lineHeight: tokens.typography.lineHeight.display,
          }}
        >
          ConsequenceStudio
        </h1>
        <p
          style={{
            fontFamily: tokens.typography.fontFamily.ui,
            fontSize: tokens.typography.fontSize.body,
            color: tokens.colors.text.secondary,
          }}
        >
          Enter the cosmos. Create without limits.
        </p>
      </div>

      <div
        className="mb-6 flex rounded-md p-1"
        style={{ backgroundColor: tokens.colors.background.canvas }}
      >
        {(["signin", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setError("");
            }}
            className="flex-1 rounded py-2 transition-colors"
            style={{
              fontFamily: tokens.typography.fontFamily.ui,
              fontSize: tokens.typography.fontSize.compact,
              fontWeight: tokens.typography.fontWeight.medium,
              backgroundColor: mode === tab ? tokens.colors.background.elevated : "transparent",
              color: mode === tab ? tokens.colors.text.accent : tokens.colors.text.secondary,
            }}
          >
            {tab === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, x: mode === "signin" ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === "signin" ? 12 : -12 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.fontFamily.ui,
              }}
            >
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="rounded-md border px-3 py-2.5 outline-none transition-colors focus:border-[#3A3A3A]"
              style={{
                backgroundColor: tokens.colors.background.surface,
                borderColor: tokens.colors.border.standard,
                color: tokens.colors.text.primary,
                fontFamily: tokens.typography.fontFamily.ui,
                fontSize: tokens.typography.fontSize.body,
              }}
              placeholder="any username"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span
              style={{
                fontSize: tokens.typography.fontSize.sm,
                color: tokens.colors.text.secondary,
                fontFamily: tokens.typography.fontFamily.ui,
              }}
            >
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="rounded-md border px-3 py-2.5 outline-none transition-colors focus:border-[#3A3A3A]"
              style={{
                backgroundColor: tokens.colors.background.surface,
                borderColor: tokens.colors.border.standard,
                color: tokens.colors.text.primary,
                fontFamily: tokens.typography.fontFamily.ui,
                fontSize: tokens.typography.fontSize.body,
              }}
              placeholder="any password"
            />
          </label>

          {error && (
            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.accent.error }}>
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="mt-2 rounded-md py-3 font-medium transition-shadow"
            style={{
              backgroundColor: tokens.colors.text.accent,
              color: tokens.colors.background.canvas,
              fontFamily: tokens.typography.fontFamily.ui,
              fontSize: tokens.typography.fontSize.body,
              boxShadow: "0 0 24px rgba(255, 255, 255, 0.15)",
            }}
          >
            {mode === "signin" ? "Enter Studio" : "Create Account"}
          </motion.button>
        </motion.form>
      </AnimatePresence>

      <p
        className="mt-6 text-center"
        style={{
          fontSize: tokens.typography.fontSize.xs,
          color: tokens.colors.text.muted,
          fontFamily: tokens.typography.fontFamily.ui,
        }}
      >
        HBM &amp; Company · consequence.software
      </p>
    </motion.div>
  );
}

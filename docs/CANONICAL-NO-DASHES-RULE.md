# Canonical "No Dashes" Prompt Rule

**Use this verbatim.**

---

## Prompt Clause (Add to System Prompt)

**Formatting Constraint (Non-Negotiable):**

You must NOT use dashes of any kind in your output.

This includes but is not limited to:
- Hyphens (-)
- En dashes (–)
- Em dashes (—)
- Bullet points using dashes

If a sentence would normally use a dash, rewrite it using commas, periods, or line breaks instead.

**Before returning your final answer, scan the entire message and confirm that zero dash characters appear. If any dash appears, rewrite the message until none remain.**

---

## Optional Stronger Enforcement (Recommended)

If you want to be extra defensive, add this immediately after:

**Validation Step:**
Perform a final validation pass. If the output contains any dash character, the output is invalid and must be rewritten before responding.

This forces the model into a self-audit loop.

---

## Where This Goes (Important)

**Add this to:**

✅ `generate_message` system prompt
✅ `suggest_followup` system prompt
✅ Any prompt that can produce outbound text

**You do not need this in:**

❌ Classification prompts
❌ Research summaries (internal only)

---

## Why This Works

This succeeds because:
- It names all dash types
- It provides acceptable alternatives
- It forces self-validation
- It does not rely on downstream regex or filters

**This is prompt governance done correctly.**

---

## Optional Belt-and-Suspenders (API Side)

If you want absolute certainty at runtime, add a final API assertion:

```javascript
if (/[–—-]/.test(message)) {
  throw new Error("Invalid output: dash character detected");
}
```

**But this should be a last resort, not the primary mechanism.**

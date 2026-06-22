## Edge Function Deploy Rule
Supabase edge functions are deployed via dashboard paste, NOT CLI. The repo and the
dashboard can drift. To prevent drift:
1. Edit edge function code in the repo first.
2. Paste the full file into the Supabase dashboard and Deploy.
3. Never edit a function only in the dashboard without also updating the repo.
4. Before debugging any "this worked before" edge function bug, FIRST confirm the
   deployed dashboard code matches the repo — they may have drifted.

Key facts about the deployed reality:
- Edge functions are self-contained (no _shared imports on the dashboard).
- Learner language is stored in profiles.lang (matched on profiles.id = user.id),
  NOT learners.lang.
- Each AI function inlines its own callClaude and Anthropic call.

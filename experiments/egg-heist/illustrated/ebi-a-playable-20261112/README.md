# Ebi: one playable jump

Question: does triggering the approved rear-view jump feel responsive enough to repeat?

Throwaway interaction test, 30 minute timebox starting 15:56 Singapore time, 12 November 2026.
Keep if Alan understands the control immediately and wants another jump. Retune if the crouch or landing feels slow. This does not establish a game challenge yet.

Scope: this folder and the generated sibling HTML only. Reuse the approved six poses, kitchen, egg tray and motion sampler. No site integration, new dependencies, publishing, persistence or data collection.

Run `python3 experiments/egg-heist/illustrated/ebi-a-playable-20261112/build.py` from the worktree, then `node experiments/egg-heist/illustrated/ebi-a-playable-20261112/check.cjs`.

Assets and generation prompts retain their provenance in `../ebi-a-rear-motion-20261112/provenance.json` and `../ebi-a-motion-20261112/provenance.json`. This test changes only the controls and playback. It skips the opening held pose, starts crouching on input, stops on landing, and removes the automatic fade and loop. Reduced motion shows the landed result directly.

Shortcut: the six held drawings still change visibly; add in-between drawings after this interaction is accepted.

Archived on 13 November 2026 for PR #132. Desktop Chrome verified the catch, stable landing and Reset on 12 November. Phone testing and live-site integration remain undone. See the parent README for the latest approval status.

# auto-paths-sim

Random search over BIOBUZZ AUTO routines, using the
[ftc-biobuzz-sim](https://github.com/caryden/ftc-biobuzz-sim) simulator. It ranks candidates for all four start
positions (red right, red left, blue right, blue left) and prints the top 10 of each.

## How to run

1. Clone `caryden/ftc-biobuzz-sim` and run `npm ci` in it.
2. Copy `auto-search.ts` into that repo's `scripts/` folder (it imports the simulator's own code).
3. Run:

   ```
   npx tsx scripts/auto-search.ts [candidates=200] [seeds=6] [workers=4] [rngSeed=1]
   ```

   Start small, for example `40 4 4 1`. A full 200 x 6 run across all four starts may take about an hour (a rough guess).

It writes `auto-search-top10.json` in the sim repo. Each entry has its settings and the full tree.

## What it does

- Each start position gets its own random variants of the sim's default tree (`wall-sweep-pair-right` or `-left`):
  launch spot, shot counts, sweep angle and reach, waits, and whether the FLOWER step, second sweep or last cycle runs.
- Candidate 0 is the unchanged default, as a yardstick.
- Score = the alliance's AUTO points (LEAVE, AUTO PARK, TIPs) + 2 per element left in the hoppers when AUTO ends.
  The hopper bonus is only a tie-breaker; change `HOPPER_BONUS` to taste.
- The partner and the other alliance run their default AUTO.

## Limits

- It scores AUTO only, not a whole match, and only in the simulator. Real launcher consistency and robot speed
  will change the results.
- The output is sim trees, not Pedro Pathing code. Porting a winner to Pedro paths is a separate step.

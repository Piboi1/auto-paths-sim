# auto-paths-sim

Random search over BIOBUZZ AUTO routines, using the
[ftc-biobuzz-sim](https://github.com/caryden/ftc-biobuzz-sim) simulator. It ranks candidates for all four start
positions (red right, red left, blue right, blue left) and prints the top 10 of each.

## How to run

1. Clone `caryden/ftc-biobuzz-sim` and run `npm ci` in it.
2. Copy `auto-search.ts` into that repo's `scripts/` folder (it imports the simulator's own code).
3. Run:

   ```
   npx tsx scripts/auto-search.ts [candidates=200] [seeds=6] [workers=CPU cores - 1] [rngSeed=1]
   ```

   Start small, for example `40 4 4 1`. A full 200 x 6 run across all four starts may take about an hour (a rough guess).

### Running more simulations at once

- **Workers** (3rd argument) is how many simulations run in parallel, one process each. It defaults to your CPU cores
  minus one. Raise it up to the core count if nothing else is running; more than that doesn't help.
  On a Mac, `sysctl -n hw.ncpu` shows the core count.
- **More candidates or seeds** (1st and 2nd arguments) make a bigger search; time grows in proportion.
- **More computers:** run with a different last argument, for example `... 200 6 8 2` on a second machine, so each
  one tries different random candidates. Compare the `auto-search-top10.json` files afterwards.

It writes `auto-search-top10.json` in the sim repo. Each entry has its settings and the full tree.

## What it does

- Each start position gets its own random variants of the sim's default tree (`wall-sweep-pair-right` or `-left`):
  launch spot, shot counts, sweep angle and reach, waits, and whether the FLOWER step, second sweep or last cycle runs.
- Candidate 0 is the unchanged default, as a yardstick.
- Candidates are ranked in this order; a later criterion only matters when the earlier ones tie:
  1. mean AUTO points (LEAVE + AUTO PARK + TIPs),
  2. the worst seed's AUTO points (reliability),
  3. the time of the 4th TIP (earlier is better; a missing one counts as 30 s),
  4. elements still in the hoppers when AUTO ends.
- Left-start launch headings stay at 126 degrees or more: below that, a test run lost the camera's view of the rear
  CELL's tags and the later TIPs never happened.
- The partner and the other alliance run their default AUTO.

## Limits

- It scores AUTO only, not a whole match, and only in the simulator. Real launcher consistency and robot speed
  will change the results.
- The output is sim trees, not Pedro Pathing code. Porting a winner to Pedro paths is a separate step.

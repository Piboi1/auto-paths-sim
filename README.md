# auto-paths-sim

Random search over BIOBUZZ AUTO routines, using the
[ftc-biobuzz-sim](https://github.com/caryden/ftc-biobuzz-sim) simulator. It ranks candidates for all four start
positions (red right, red left, blue right, blue left) and prints the top 10 of each.

## How to run

1. Clone `caryden/ftc-biobuzz-sim` and run `npm ci` in it.
2. Copy `auto-search.ts` into that repo's `scripts/` folder (it imports the simulator's own code).
3. Run:

   ```
   npx tsx scripts/auto-search.ts [candidates=200] [seeds=6] [workers=CPU cores - 1] [rngSeed=1] [--alliances=red] [--partners=default,meta,slow,sloppy]
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

## The shortlist, the backup and the robot being tested

- **Red only by default.** Blue is the same field mirrored, and the first tests scored red and blue the same, so the
  default run searches red and you mirror the winners for blue. Use `--alliances=red,blue` to run both.
- **Shortlist.** Besides the top 10, each start position prints up to 3 routines with different launch spots or
  different optional steps, each within 10 AUTO points of the best. That's the "couple with variety" to code first.
- **Backup.** Each start position also prints a LEAVE-and-PARK only routine (`*-backup-leave-park`). Its score depends on
  the partner's routine, because the default partner waits for the first TIP: use it as a fallback, not a ranking.
- **Robot under test.** The sim's default robot is faster than a tuned 71.6 in/s robot (about 104 in/s planned top
  speed), so the script matches the drive speed (`driveRpm` 410) by default. Set your real robot with an env var:
  `BOT='{"driveRpm":410,"sizeIn":14,"massLb":20,"dualIntake":true}' npx tsx scripts/auto-search.ts 40 6`
  (every field is in `BotSetup` in the sim's `src/setup.ts`). Partners and opponents stay at the sim default.
- **Sanity columns.** `dist m` is the distance driven in AUTO and `top m/s` the top speed. A `check` line appears if a
  shortlisted routine misses 4 TIPS on some seeds, has a late first TIP, or exceeds the robot's top speed.
  These don't replace looking at the path: check that every pose is reachable and clear of obstacles for your robot.

## See the results in the simulator

The sim has no import button yet, so `export-to-sim.ts` adds the routines that the search found to your local copy:

1. Copy `export-to-sim.ts` into the sim's `scripts/` folder (next to `auto-search.ts`) and run it after a search:

   ```
   npx tsx scripts/export-to-sim.ts          # the shortlist and backups
   npx tsx scripts/export-to-sim.ts --top10  # the top 10 as well
   ```

   It writes `src/auto/trees/auto/found-<id>.json` and adds those files to the list in `src/auto/onboard.ts`.
2. Start the sim with `npm run dev` and open the address it prints.
3. Click the gear icon next to a robot's number, and set its **AUTO plan** to one of the `Found: ...` plans. They are
   listed by start position, so a right-start robot (R0 or B0) shows the right-start ones and a left-start robot (R1 or
   B1) the left-start ones. Start the match to watch it. **Edit AUTO paths** in the gear menu shows the plan's steps.
4. Undo it when you're done (these are local experiments, not for committing):

   ```
   git checkout src/auto/onboard.ts && rm src/auto/trees/auto/found-*.json
   ```

Run it again after each new search; it replaces its earlier `found-` files.

## Testing against different partners

You won't know your partner until you get there, so each candidate is run against several partner setups. The partner
and both opponents all use the named setup (your own robot stays as set by `BOT`):

| Setup | The other three robots |
|---|---|
| `default` | The sim's default robot (600 rpm, 38 cm, 10 kg) |
| `meta` | The sim's light, fast "meta build" (500 rpm, 30.5 cm, 7 kg, dual intake, catapult) |
| `slow` | Slow and heavy: 312 rpm, 28 lb |
| `sloppy` | 3x the launch error and 80% intake success |

The table's last column shows the mean AUTO points per setup, in that order, for example `96/96/76/56`. Use
`--partners=default,meta` to test fewer setups: the run time grows with the number of setups.

Limits: AUTO points are for the whole alliance, so a poor partner lowers every candidate's score. The comparison is fair
between candidates (they all get the same partner), but a low "worst setup" number mostly measures what a weak partner
costs, not a flaw in the routine. The sim can't model a partner that runs its own unknown AUTO, doesn't show up, or has
a human driver. Ask your partner before the match where they start, where they launch from and what they collect.

## What it does

- Each start position gets its own random variants of the sim's default tree (`wall-sweep-pair-right` or `-left`):
  launch spot, shot counts, sweep angle and reach, waits, and whether the FLOWER step, second sweep or last cycle runs.
- Candidate 0 is the unchanged default, as a yardstick.
- Candidates are ranked in this order; a later criterion only matters when the earlier ones tie:
  1. mean AUTO points in the **worst partner setup** (see below),
  2. mean AUTO points over all setups,
  3. the worst single run's AUTO points,
  4. the time of the 4th TIP (earlier is better; a missing one counts as 30 s),
  5. elements still in the hoppers when AUTO ends.
- Left-start launch headings stay at 126 degrees or more: below that, a test run lost the camera's view of the rear
  CELL's tags and the later TIPs never happened.
- The partner and the other alliance run their default AUTO.

## Limits

- It scores AUTO only, not a whole match, and only in the simulator. Real launcher consistency and robot speed
  will change the results.
- The output is sim trees, not Pedro Pathing code. Porting a winner to Pedro paths is a separate step.

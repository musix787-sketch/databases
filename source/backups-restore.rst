Backups and restore
======================

A backup you haven't tested restoring isn't a backup, it's a hope.

.. _backup-types:

Logical vs physical backups
-------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Type
     - What it is
     - Trade off
   * - **Logical**
     - A dump of the data as SQL statements or a portable format, like
       ``pg_dump``
     - Slower to restore on big databases, but portable across versions and
       even across systems
   * - **Physical**
     - A byte-for-byte copy of the actual data files on disk
     - Fast to restore, but tied to the exact same database version and
       usually the same architecture

Most teams use physical backups for day-to-day recovery, and keep a logical
dump around for migrations or moving to a different provider.

.. _pitr:

Point in time recovery
--------------------------

A daily snapshot only gets you back to last night. Point in time recovery
(PITR) replays the write-ahead log on top of a base backup, so you can restore
to any specific second, right up until just before someone ran the bad
``DELETE``.

.. code-block:: text

   base backup (midnight) + WAL logs (00:00 to 14:32) = state at 14:32

This is the difference between "we lost a day of data" and "we lost 30
seconds of data." If your database supports it, it's worth setting up before
you need it, not after.

.. warning::
   PITR only works if you kept the WAL logs. Most managed databases handle
   this for you, but if you're self-hosting, check your WAL retention
   settings, not just that backups are running.

.. _restore-drill:

The restore drill
---------------------

Backups fail silently more often than they fail loudly. A backup job can run
green for months while producing a file that can't actually be restored.

A basic restore drill checklist

1. Spin up a fresh instance, separate from production
 - Restore the latest backup onto it
 - Run a handful of real queries against it and check the results look right
 - Time how long the restore actually took
 - Do this on a schedule, not just once

That last point matters most. A restore that worked six months ago tells you
nothing about whether it works today, schemas change, backup tooling gets
upgraded, and permissions drift.

.. _backup-retention:

How much history to keep
-----------------------------

There's no universal answer, but a common pattern:

- Daily backups kept for a couple weeks
- Weekly backups kept for a couple months
- Monthly backups kept for a year or more, for anything with compliance
  requirements

Balance this against storage cost and how far back you'd realistically ever
need to go. Keeping ten years of daily backups nobody will ever restore is
just an expensive habit.

.. _incremental-backups:

Full, incremental, and differential
-----------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Type
     - What it captures
     - Trade off
   * - **Full**
     - Everything, every time
     - Simple to restore, slow and expensive to run often
   * - **Incremental**
     - Only what changed since the last backup, full or incremental
     - Fast and cheap, but restoring means replaying a whole chain in order
   * - **Differential**
     - Everything changed since the last full backup
     - Middle ground, restore only needs the last full plus one differential

Most managed databases handle this mix for you automatically, worth knowing
the shape of it if you're troubleshooting a slow restore.

.. _cross-region-backups:

Storing backups outside the region
-----------------------------------------

A backup stored in the same region, or worse the same data center, as the
database doesn't help if that whole region goes down. Cross-region backup
storage costs a bit more but covers the failure mode that actually matters
most, losing an entire region, not just one machine.

.. _encrypting-backups:

Encrypting the backups themselves
----------------------------------------

A backup file is a full copy of your data, it deserves the same protection
as the live database, sometimes more, since backups often sit around
untouched for longer and get copied to more places. Encrypt at rest, and
if backups are shipped anywhere, encrypt in transit too.

.. _automating-schedule:

Automating the schedule
----------------------------

.. code-block:: text

   0 2 * * *   full backup, daily at 2am
   */15 * * *  WAL archiving, continuous

Manual backups get forgotten. A scheduled job that runs without anyone
remembering to trigger it is the only kind that's still running a year from
now.

.. _backup-under-load:

Backing up during heavy write traffic
--------------------------------------------

A backup job itself uses disk I/O and sometimes locks, running a big backup
during your busiest traffic hour can slow everything else down. Most teams
schedule full backups during a known quiet window, and rely on continuous
WAL archiving to cover the gaps in between.

.. _restore-to-new-env:

Restoring into a fresh environment
------------------------------------------

Beyond the basic restore drill, it's worth occasionally restoring a backup
into an environment that isn't just a clone of production, like a staging
setup with different resource limits. This catches problems that only show
up when the restore target isn't identical to where the backup came from.

.. _backup-monitoring:

Monitoring backups, not just running them
-------------------------------------------------

A backup job can fail silently, or succeed while producing a truncated,
unusable file. Alert on the job actually finishing successfully, and
separately, track how old your most recent good backup is, not just whether
the job ran.

.. _rto-rpo:

RTO and RPO
----------------

.. list-table::
   :header-rows: 1
   :widths: 20 40 40

   * - Term
     - Means
     - Practical question
   * - **RPO**
     - Recovery point objective, how much data you can afford to lose
     - How far apart are your backups or WAL archiving intervals
   * - **RTO**
     - Recovery time objective, how long you can afford to be down
     - How long does an actual restore take, tested, not guessed

Write these down as actual numbers your team agrees on, not vague goals.
They decide how often you back up and how much you invest in fast restores.

.. _backing-up-adjacent-systems:

Don't forget what's next to the database
-------------------------------------------------

A database restore that comes back without the application config,
migration history, or secrets needed to connect to it isn't a full recovery.
Keep track of what else needs to come back together with the data.

.. _backup-naming:

Naming and versioning backup files
------------------------------------------

A folder full of files named ``backup_final_v2_REAL.sql`` is a disaster
during an actual incident. Use a consistent, timestamped naming scheme so
whoever's doing the restore, possibly not you, can tell at a glance which
backup is which without guessing.

Databases, from the ground up
==============================

This is the guide I wish someone had handed me before my first "design the
schema" interview question. It goes from "what even is a database" to why
your production Postgres instance falls over at 3am, and it tries not to
skip the boring-but-important parts in between.

Each topic below is its own page.

Start here
----------

- `What's a database, really <start.rst#whats-a-database-really>`_ —
  Strip away the buzzwords and a database is just an organized pile of
  information kept somewhere it won't...
- `What a DBMS is actually doing all day <start.rst#what-a-dbms-is-actually-doing-all-day>`_ —
  A DBMS earns its keep by doing a handful of unglamorous jobs,
  constantly, without you noticing. When you...
- `Why not just use files? <start.rst#why-not-just-use-files>`_ —
  You genuinely can build a system on flat files, CSVs, JSON blobs,
  whatever. Plenty of small tools do...

Data models
-----------

- `The five shapes data can take <data-models.rst#the-five-shapes-data-can-take>`_ —
  Picking a data model is picking which questions will be easy to ask
  later and which will be painful...
- `"SQL vs. NoSQL" isn't really the question <data-models.rst#sql-vs-nosql-isnt-really-the-question>`_ —
  This gets framed as a rivalry, but it's closer to comparing a
  screwdriver to a whole toolbox labeled "not"...

Under the hood
---------------

- `ACID, unpacked <under-the-hood.rst#acid-unpacked>`_ —
  ACID gets recited like a magic word in interviews, but each letter
  is answering a specific, concrete fear...
- `Normal forms, without the textbook language <under-the-hood.rst#normal-forms-without-the-textbook-language>`_ —
  Normalization is really just "don't write the same fact in two
  places." If a customer's address changes,...
- `Indexes: the whole reason queries aren't slow <under-the-hood.rst#indexes-the-whole-reason-queries-arent-slow>`_ —
  Without an index, finding a row means the database checks every
  single one, a full table scan. On a table...
- `Transactions and what happens when two writes collide <under-the-hood.rst#transactions-and-what-happens-when-two-writes-collide>`_ —
  A transaction is a group of operations that either all succeed or
  all fail together, you saw the "A" in...
- `The CAP theorem, in one paragraph <under-the-hood.rst#the-cap-theorem-in-one-paragraph>`_ —
  Once a database is spread across more than one machine, the network
  between those machines will eventually...

At scale
--------

- `Replication: copies for safety and speed <at-scale.rst#replication-copies-for-safety-and-speed>`_ —
  A replica is a second copy of your database that stays in sync with
  the original, usually by streaming the...
- `Sharding: when one machine isn't enough, period <at-scale.rst#sharding-when-one-machine-isnt-enough-period>`_ —
  Replication copies the same data everywhere. Sharding does the
  opposite, it splits the data itself across...

Reference
---------

- `Popular systems, and where they actually shine <reference.rst#popular-systems-and-where-they-actually-shine>`_ —
  None of these "win" outright, each was built with a specific set of
  trade-offs in mind, and the honest...
- `Glossary <reference.rst#glossary>`_ —
  Key terms used throughout this guide.

----

Databases, from the ground up
==============================

This is the guide I wish someone had handed me before my first "design the
schema" interview question. It goes from "what even is a database" to why
your production Postgres instance falls over at 3am, and it tries not to
skip the boring-but-important parts in between.

Each topic below is its own page.

Start here
----------

- `What's a database, really <start.rst#whats-a-database-really>`_
- `What a DBMS is actually doing all day <start.rst#what-a-dbms-is-actually-doing-all-day>`_
- `Why not just use files? <start.rst#why-not-just-use-files>`_

Data models
-----------

- `The five shapes data can take <data-models.rst#the-five-shapes-data-can-take>`_
- `"SQL vs. NoSQL" isn't really the question <data-models.rst#sql-vs-nosql-isnt-really-the-question>`_

Under the hood
---------------

- `ACID, unpacked <under-the-hood.rst#acid-unpacked>`_
- `Normal forms, without the textbook language <under-the-hood.rst#normal-forms-without-the-textbook-language>`_
- `Indexes: the whole reason queries aren't slow <under-the-hood.rst#indexes-the-whole-reason-queries-arent-slow>`_
- `Transactions and what happens when two writes collide <under-the-hood.rst#transactions-and-what-happens-when-two-writes-collide>`_
- `The CAP theorem, in one paragraph <under-the-hood.rst#the-cap-theorem-in-one-paragraph>`_

At scale
--------

- `Replication: copies for safety and speed <at-scale.rst#replication-copies-for-safety-and-speed>`_
- `Sharding: when one machine isn't enough, period <at-scale.rst#sharding-when-one-machine-isnt-enough-period>`_

Reference
---------

- `Popular systems, and where they actually shine <reference.rst#popular-systems-and-where-they-actually-shine>`_
- `Glossary <reference.rst#glossary>`_

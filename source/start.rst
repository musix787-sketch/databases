Database basics
================

The core ideas, before anything else.

.. _what-is-a-database:

What's a database, really
--------------------------

Strip away the buzzwords and a database is just an organized pile of
information kept somewhere it won't disappear the moment your computer
restarts. That's it. A spreadsheet is a (bad) database. A phone book is a
database. What separates a "real" database from a folder of text files is
mostly discipline: rules about how data is shaped, who's allowed to touch
it, and what happens if two people try to change the same thing at once.

The word gets used loosely, so it helps to split it into two things people
usually mean at the same time without realizing it:

.. grid:: 1 2 2 2
   :gutter: 3

   .. grid-item-card:: The database

      The actual data sitting on disk, the rows, the files, the bytes. On
      its own it's inert. It can't answer a question or stop you from
      typing your age as "banana."

      *Think: the filing cabinet itself.*

   .. grid-item-card:: The DBMS

      The software wrapped around that data, Postgres, MongoDB, whatever,
      that enforces rules, answers queries, and keeps things intact when
      the power goes out mid-write.

      *Think: the librarian, not the shelves.*

People say "database" for both, the same way people say "phone" to mean
the physical object and the whole service plan behind it. It rarely
causes confusion, except in interviews where someone asks you to define
it precisely and you realize you never had to before.

.. _what-is-a-dbms:

What a DBMS is actually doing all day
---------------------------------------

A DBMS earns its keep by doing a handful of unglamorous jobs, constantly,
without you noticing. When you write ``INSERT INTO orders ...``, a small
chain of events kicks off before anything hits disk:

#. **Parse the request** — Your SQL (or query language of choice) gets
   checked for syntax errors and turned into something the engine can
   reason about, an abstract syntax tree, not a string.
#. **Plan the cheapest way to do it** — The query planner looks at
   available indexes, table sizes, and statistics, then picks an
   execution plan. This is the step where a missing index turns a 2ms
   query into a 4-second one.
#. **Check the rules** — Constraints, foreign keys, uniqueness, anything
   you've told the database to enforce gets checked here. Break one and
   the whole operation is rejected.
#. **Write it down, safely** — The change is written to a write-ahead log
   before it touches the actual table files, so a crash mid-write doesn't
   leave you with half a row.
#. **Confirm and move on** — Once durability is guaranteed, the DBMS
   tells your application "done", and any locks it was holding get
   released for the next transaction.

.. note::

   Almost every "the database is slow" complaint traces back to step
   two, a plan that scans a million rows because the right index doesn't
   exist, or exists but isn't being used.

.. _files-vs-dbms:

Why not just use files?
-------------------------

You genuinely can build a system on flat files, CSVs, JSON blobs,
whatever. Plenty of small tools do exactly that, and it's a fine choice
when the data is small and only one process touches it at a time. The
trouble shows up as soon as you add the things real applications need:

.. list-table::
   :header-rows: 1
   :widths: 25 35 40

   * - Problem
     - Plain files
     - DBMS
   * - Two people editing at once
     - One of you loses your changes, silently
     - Locking or MVCC keeps both safe
   * - Power cuts mid-save
     - Corrupted or half-written file
     - Write-ahead log recovers automatically
   * - "Find every order over $50"
     - Write a script, load everything into memory
     - One indexed query, milliseconds
   * - Enforcing "email must be unique"
     - You remember to check, every time, everywhere
     - One constraint, enforced always
   * - 10 million records
     - Falls over
     - This is the normal case

None of this means files are wrong for small jobs, a config file doesn't
need ACID guarantees. But the moment two people, two processes, or a
meaningful amount of data enter the picture, the DBMS starts paying for
itself fast.

----

.. seealso::

   Next: :doc:`data-models`

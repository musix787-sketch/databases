Secrets and credential management
=====================================

Where your database password actually lives matters as much as how strong it is.

.. _the-problem:

The default bad habit
-------------------------

Database credentials often end up hardcoded in a config file, committed to
git at some point in a project's history, and never rotated because nobody's
sure what would break.

.. warning::
   A secret that's ever been committed to git is compromised, even if you
   delete it in a later commit. It's still in the history. Rotate it, don't
   just remove the line.

.. _where-secrets-go:

Where secrets should actually live
----------------------------------------

.. list-table::
   :header-rows: 1
   :widths: 25 40 35

   * - Option
     - Good for
     - Watch out for
   * - **Environment variables**
     - Small projects, simple setups
     - Still visible to anything that can read the process environment,
       and easy to accidentally log
   * - **Secrets manager**
     - Anything with more than one environment or person involved
     - Adds a dependency and a bit of setup, but rotation and access
       control come built in
   * - **.env files**
     - Local development only
     - Never meant for production, and needs a ``.gitignore`` entry from
       day one

.. _rotation:

Rotating credentials
-------------------------

Rotation only works if it's boring and routine, not a special event that
happens once after an incident.

1. Create a new credential alongside the old one, both work

2. Update the app to use the new credential

3. Confirm nothing is still using the old one

4. Revoke the old credential

Skipping step 3 is the most common mistake, revoking the old credential
before confirming nothing depends on it anymore turns a routine rotation into
an outage.

.. _least-access:

Who gets access to secrets
--------------------------------

A reasonable default
---------------------------------

- Production credentials accessible to the deploy pipeline, not to every developer's laptop

- Different credentials per environment, staging and production should never share a password

- An audit trail of who accessed or changed a secret and when, most secrets managers give you this for free

.. note::
   The goal isn't paranoia, it's making sure that if one laptop or one CI
   job gets compromised, the blast radius is one credential, not every
   environment your team has ever touched.

.. _secrets-cicd:

Secrets in CI/CD pipelines
--------------------------------

Build and deploy pipelines often need database credentials too, to run
migrations, for example. Store them in the CI platform's own secrets store,
not as plain environment variables in a config file that gets checked into
the same repo as the code.

.. _secrets-kubernetes:

Secrets in containers and Kubernetes
--------------------------------------------

A raw Kubernetes ``Secret`` is only base64 encoded, not encrypted, by
default. For anything production facing, pair it with encryption at rest
for the cluster's secret store, or use an external secrets manager that
injects values at runtime instead.

.. _dynamic-secrets:

Dynamic, short lived secrets
------------------------------------

Instead of one long-lived database password, some secrets managers can
generate a brand new, temporary credential for each session or each
deployment, automatically expiring shortly after. Shrinks how long a leaked
credential would even remain useful.

.. _detecting-leaks:

Detecting a leaked secret
------------------------------

.. dropdown:: A few common ways secrets leak

   - Committed to a public or private git repo, including in old commit
     history
   - Printed in application logs during an error
   - Pasted into a chat message or a ticket while debugging

Automated secret scanning tools can catch a lot of these before or shortly
after they happen, worth running one against your repos as a matter of
course, not just after an incident.

.. _secrets-versioning:

Versioning secrets
------------------------

When a secret changes, you often need the previous version to keep working
briefly during rotation. Most secrets managers support versioned secrets for
exactly this, so the old and new value can coexist for the short window
where a rotation is in progress.

.. _break-glass:

Break glass emergency access
------------------------------------

For the rare situation where normal access is unavailable, the person who
normally has access is unreachable, the secrets manager itself is down,
document a separate, tightly controlled emergency path. It should be usable
under pressure, but leave a clear audit trail that it was used.

.. _third-party-secrets:

Secrets for third party integrations
------------------------------------------

API keys for external services often end up scattered across config files
the same way database credentials do. Treat them with the same discipline,
in a secrets manager, rotated periodically, not hardcoded, they're just as
capable of causing damage if leaked.

.. _local-dev-secrets:

Secrets in local development
-------------------------------------

Developers need something to connect to a local or shared dev database, but
that doesn't mean production credentials. Use clearly separate, low-stakes
credentials for local work, so a laptop getting compromised doesn't mean
production access getting compromised.

.. _auditing-secret-access:

Auditing who accessed which secret
-------------------------------------------

Knowing a secret exists and is stored securely is half the picture, knowing
who actually retrieved it, and when, matters just as much during an
investigation. Most secrets managers log this by default, worth confirming
that logging is actually turned on and retained.

.. _secrets-manager-dr:

What if the secrets manager itself goes down
----------------------------------------------------

A secrets manager is now a dependency your database connection relies on.
Worth having a plan, even a manual one, for what happens if it's
unreachable, since that failure mode takes down everything that depends on
it fetching a credential to even start up.

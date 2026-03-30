# DLE -> Express migration plan (by stages)

## Stage 0. Safety
- Keep production DLE untouched.
- Backup completed:
  - SQL dump: `backup/dle-backup-*/visitabay.sql`
  - Files archive: `backup/dle-backup-*/dle-files.zip`

## Stage 1. Express read-only layer
- Bootstrap new app in `express-migration/`.
- Connect to existing DLE MySQL.
- Implement read endpoints/pages:
  - Home list
  - Post by slug

## Stage 2. Data mapping
- Map DLE tables into service layer:
  - `abay_post`, `abay_category`, `abay_static`, `abay_users`
- Introduce DTO mapping from DLE fields to new domain model.

## Stage 3. Template migration
- Recreate key pages from `templates/visitabay`:
  - `main`
  - category pages (`24`, `31`, `32`)
  - fullstory pages
- Keep URL compatibility.

## Stage 4. SEO and redirects
- Preserve canonical URLs.
- Generate redirect map old DLE URL -> new URL (301).
- Add sitemap/robots equivalents.

## Stage 5. Parallel launch
- Run Node app on separate port/domain.
- QA checks for content parity and broken links.
- Switch traffic behind reverse proxy.

## Stage 6. Cutover
- Freeze DLE content edits.
- Final DB sync script.
- Switch to Node production.


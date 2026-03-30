# Express Migration (DLE -> Node.js)

## Run
1. Copy `.env.example` to `.env` (already created in this workspace).
2. Install deps:
   - `npm install`
3. Start server:
   - `npm start`
4. Open:
   - `http://localhost:4000/`

## Implemented routes
- `/` - latest posts from DLE DB
- `/post/:slug` - post by `alt_name`
- `/category/:slug` - category page by `abay_category.alt_name`
- `/page/:name` - static page by `abay_static.name`

## Legacy compatibility (301)
- `/*.html` -> `/post/:slug`
- `/index.php?do=static&page=...` -> `/page/...`

## Redirect map export
- `npm run build:redirects`
- Output: `docs/redirect-map.json`

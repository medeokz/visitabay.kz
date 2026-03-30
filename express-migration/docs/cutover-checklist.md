# DLE -> Node.js Cutover Checklist

## 1) Before switch
- [ ] Verify backup exists:
  - `backup/dle-backup-*/visitabay.sql`
  - `backup/dle-backup-*/dle-files.zip`
- [ ] Node app healthy on `:4000`
- [ ] Core pages return 200:
  - `/`
  - `/category/hotels`
  - `/post/<any-slug>`
  - `/page/dle-rules-page`
- [ ] Legacy redirects return 301:
  - `/*.html`
  - `/index.php?do=static&page=...`
- [ ] `robots.txt` and `sitemap.xml` available

## 2) Canary rollout (recommended)
- [ ] Enable proxy only for:
  - `/post/*`
  - `/category/*`
  - `/page/*`
- [ ] Keep DLE serving admin and remaining paths
- [ ] Monitor:
  - 404 rate
  - response times
  - DB load

## 3) Full switch
- [ ] Put DLE content edits on hold
- [ ] Apply full proxy to Node frontend
- [ ] Keep DLE admin path (`/admin.php`) on PHP backend
- [ ] Warm up cache (visit top pages)

## 4) Post-switch verification
- [ ] Crawl top 200 URLs and validate status codes
- [ ] Confirm redirects preserve SEO paths
- [ ] Check search, category pages, fullstory pages
- [ ] Validate media loading from `/uploads`

## 5) Rollback plan
- [ ] Keep previous proxy config file ready
- [ ] If critical issue:
  - revert proxy to DLE
  - restart web server
  - verify DLE home/admin


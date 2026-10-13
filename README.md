# Baby Reveal — Vercel global voting

## Files
- `index.html`: your baby reveal page; it calls `/api/votes`.
- `api/votes.js`: server-side Vercel function; keeps the CounterAPI token off the client.
- `.env.example`: placeholder example only. Never put a real token in a committed file.
- `.gitignore`: ignores local environment files.

## 1. Configure CounterAPI
1. Create/sign in to CounterAPI and create a workspace.
2. Create two counters in that workspace named exactly:
   - `baby-boy-votes`
   - `baby-girl-votes`
3. Generate an API token that has permission to read and increment those counters.

The code uses CounterAPI v2 endpoints:
`/v2/{workspace}/{counter}` and `/v2/{workspace}/{counter}/up`.

## 2. Deploy to Vercel
1. Upload/push the whole project folder to your GitHub repository (or import the repository into Vercel).
2. In Vercel, open Project → Settings → Environment Variables.
3. Add `COUNTER_WORKSPACE` = the exact workspace identifier from CounterAPI.
4. Add `COUNTER_API_TOKEN` = your token.
5. Select Production (and Preview if required), save, then redeploy.

Do not replace placeholders in `index.html`; there are no secrets in that file.

## 3. Test
- Open the deployed URL and check the browser console/network if totals fail.
- Vote once in a browser, then open the site in a different browser to verify global totals.
- The frontend uses localStorage to avoid repeat votes in the same browser. This is convenience-level protection, not identity verification; clearing browser data or switching devices can bypass it.

## Security note
The CounterAPI token is kept server-side. This endpoint is public, so determined visitors can still call it directly and increment counters repeatedly. For stronger anti-abuse / one-person-one-vote enforcement, use a database-backed vote record plus rate limiting or identity verification.

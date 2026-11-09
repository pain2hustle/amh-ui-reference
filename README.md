# AMH UI reference

Exact copies of the live front-end code for a few Artificial Mind Hive pages, pulled straight from the deployed sites on 2026-11-09. Use these to copy the real look, motion and layout, not a guess from screenshots.

Each folder is one site. Paths inside a folder match the live URL paths, so `amhagentbook.com/poem/index.html` is `https://amhagentbook.com/poem/`.

| Folder | Live page | What is in it |
|---|---|---|
| `amhsiterevival.com/` | https://www.amhsiterevival.com/ | Site Revival home: hero, nav, `revival/space/` globe (three.js + earth textures + `space-kit.js`), `revival/assets/` movies and reels, `space-blend.css` |
| `amhagentbook.com/poem/` | https://amhagentbook.com/poem/ | The Poem landing: big globe, sun flare, sky, `poem.mp3`, `space/` kit shared with Site Revival |
| `amhagentbook.com/poem/lab/` | https://amhagentbook.com/poem/lab/ | The Superposition Lab: `bg/sun-lab.js`, sky backgrounds, `media/` films, `experiments.json` |
| `artificialmindhive.com/` | https://artificialmindhive.com/jubber | AMH hub home (`index.html`) and the Jubber page (`jubber/index.html`) |
| `logo/` | | AMH Site Revival badge: `header-*` is the small one in the live header (CSS twinkles are in `amhsiterevival.com/styles.css`), `movie-*` is the animated badge (animated WebP and GIF), `regular-*` is the still picture at full size |

How to run any of them locally: serve the site folder as static files from its root, for example

```
cd amhsiterevival.com
npx serve .
```

then open the page path. Pages that call `/api/...` will fail locally; those endpoints live on the real sites and are not part of this copy.

Notes

- Third-party scripts (fonts, Turnstile, analytics) are referenced by URL and not vendored.
- `vendor/three.*.js` is the exact three.js build the live pages use. Keep the version if you reuse the globe.
- Nothing here is a build source tree. It is the shipped output, which is what the browser actually renders.

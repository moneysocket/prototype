This uses `gulp` to build. Will need to `npm install` dependencies. `gulp quick_watch` (or `npm run quick-watch` if you don't have gulp installed globally) will build the app and copy resources into a `htdocs/` subdirectory.  

Then serve the htdocs directory. Ex: `cd htdocs; python3 -m http.server`

Alternatively: 
```bash
npm install
npm run quick-watch
npm start

#app available at http://localhost:8000
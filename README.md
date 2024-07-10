# Audio Converter Web App

### Vue 3 + TypeScript + Vite + Firebase

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Local Development

Vite

`npm run dev`

Firebase Emulators

`firebase emulators:start`

Firebase Functions Typescript compilation

`cd functions && npm run build:watch`

## Todos

- Get id3 data of uploaded audio - https://superuser.com/questions/1699035/ffmpeg-extract-metadata or https://www.npmjs.com/package/music-metadata
- Display conversion options (~~Filetype~~, Bitrate, Bitdepth)
- Add ability to choose album artwork
- Add component / styling framework - https://vuetifyjs.com/
- ~~Display id3 fields in a form~~
- ~~Run the conversion and update id3 tags using ffmpeg~~
- ~~Display download link~~

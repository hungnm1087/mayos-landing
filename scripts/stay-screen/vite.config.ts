import {defineConfig} from 'vite';import react from '@vitejs/plugin-react-swc';import path from 'node:path';import tailwindcss from 'tailwindcss';import autoprefixer from 'autoprefixer';import {readFileSync} from 'node:fs';import {createRequire} from 'node:module';import {transformSync} from 'esbuild';
const root=path.resolve(__dirname,'../../../stay-at-lamay');
const configModule={exports:{} as any};new Function('require','module','exports',transformSync(readFileSync(path.join(root,'tailwind.config.ts'),'utf8'),{loader:'ts',format:'cjs'}).code)(createRequire(path.join(root,'package.json')),configModule,configModule.exports);const theme=configModule.exports.default;
export default defineConfig({root:__dirname,plugins:[react()],css:{postcss:{plugins:[tailwindcss({...theme,content:[path.join(root,'src/**/*.{ts,tsx}')]}),autoprefixer()]}},resolve:{dedupe:['react','react-dom','react-i18next','i18next'],alias:[
 ...['@/hooks/useHotelInfo','@/hooks/useWeather','@/hooks/useHeroImages','@/lib/opsClient','@/lib/stayAnalytics'].map(find=>({find,replacement:path.join(__dirname,'fixtures.ts')})),
 {find:'react',replacement:path.resolve(__dirname,'../../node_modules/react')},{find:'react-dom',replacement:path.resolve(__dirname,'../../node_modules/react-dom')},
 {find:'i18next',replacement:path.join(root,'node_modules/i18next')},{find:'react-i18next',replacement:path.join(root,'node_modules/react-i18next')},
 {find:'@',replacement:path.join(root,'src')} ]},server:{host:'127.0.0.1',port:4216,strictPort:true,fs:{allow:[path.resolve(__dirname,'../../..')]}}});

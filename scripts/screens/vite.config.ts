import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import theme from '../../../opslamay-visa-compact/tailwind.config';
const ops=path.resolve(__dirname,'../../../opslamay-visa-compact');
export default defineConfig({
 root:__dirname,plugins:[react()],css:{postcss:{plugins:[tailwindcss({...theme,content:[path.join(ops,'src/**/*.{ts,tsx}'),path.join(__dirname,'*.tsx')]}),autoprefixer()]}},
 resolve:{dedupe:['react','react-dom'],alias:[
  {find:'@/hooks/usePnl',replacement:path.join(__dirname,'fixtures.tsx')},
  {find:'@/hooks/useQcRun',replacement:path.join(__dirname,'qc.ts')},
  {find:'@/contexts/AuthContext',replacement:path.join(__dirname,'fixtures.tsx')},
  {find:'@/contexts/HotelContext',replacement:path.join(__dirname,'fixtures.tsx')},
  {find:'@/components/layout/MainLayout',replacement:path.join(__dirname,'layout.tsx')},
  {find:'@/integrations/supabase/client',replacement:path.join(__dirname,'fixtures.tsx')},
  {find:'react',replacement:path.join(ops,'node_modules/react')},
  {find:'react-dom',replacement:path.join(ops,'node_modules/react-dom')},
  {find:'@',replacement:path.join(ops,'src')},
 ]},server:{host:'127.0.0.1',port:4212,strictPort:true,fs:{allow:[path.resolve(__dirname,'../../..')]}}
});

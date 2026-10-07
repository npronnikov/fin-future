import {createApp} from './runtime/apps/server/src/http/server.mjs';
import {fileURLToPath} from 'node:url';
const app=createApp({dataDir:process.env.DATA_DIR||fileURLToPath(new URL('../data',import.meta.url)),webDir:fileURLToPath(new URL('./web',import.meta.url))});
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||4310);
app.server.listen(port,host,()=>console.log('КОНТУР Team Space → http://'+host+':'+port+' · mock runtime · Node '+process.version));
let closing=false;for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{if(closing)return;closing=true;app.close().then(()=>process.exit(0));});

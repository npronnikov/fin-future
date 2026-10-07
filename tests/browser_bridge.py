"""Restricted-environment UI transport. Not a real-origin/cookie/SSE-browser test.
UI event handlers and React bundle are unmodified; transport sends real HTTP to Node.
Native browser runs should use page.goto(BASE) instead (see browser_e2e.py).
"""
import json, os
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:4310')
class BrowserBridge:
 def __init__(self): self.token=''; self.online=True; self.calls=[]
 def fetch(self,args):
  if not self.online: raise RuntimeError('Test bridge network offline')
  url=args['url']; path=url.split('/api/v1',1)[-1]
  if not url.startswith('/api/v1'): raise RuntimeError('Bridge only accepts /api/v1')
  headers={'Content-Type':'application/json'}
  if self.token: headers['Authorization']='Bearer '+self.token
  data=args.get('body');method=args.get('method','GET')
  try: res=urlopen(Request(BASE+'/api/v1'+path,data=data.encode() if data else None,headers=headers,method=method),timeout=5)
  except HTTPError as e: res=e
  raw=res.read().decode();parsed=json.loads(raw)
  if path=='/demo/session' and res.status==200:self.token=parsed['token']
  if method!='GET':self.calls.append({'path':path,'method':method,'status':res.status,'type':json.loads(data or '{}').get('type')})
  return {'status':res.status,'body':raw}
 def load(self,page):
  page.expose_function('__bridgeHTTP',self.fetch)
  html='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>КОНТУР · transport bridge QA</title><style>'+ (ROOT/'dist/web/styles.css').read_text()+'</style></head><body><div id="root"></div></body></html>'
  page.set_content(html)
  page.evaluate('''() => {
   window.fetch=async (url,options={})=>{const r=await window.__bridgeHTTP({url:String(url),method:options.method||'GET',body:options.body});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}});};
   if(!crypto.randomUUID)crypto.randomUUID=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
   window.EventSource=class {
    constructor(url){this.url=url;this.listeners={};this.closed=false;this.after=Number(new URL(url,'http://test').searchParams.get('after')||0);setTimeout(()=>this.poll(),20);}
    addEventListener(type,cb){this.listeners[type]=cb;}
    close(){this.closed=true;clearTimeout(this.timer);}
    async poll(){if(this.closed)return;try{const url=this.url.replace('/events?','/events/poll?').replace(/after=\\d+/,'after='+this.after);const res=await fetch(url);if(!res.ok)throw Error('stream unauthorized');const data=await res.json();if(this.closed)return;this.onopen?.();for(const ev of data.items){this.after=ev.sequence;this.listeners.domain?.({data:JSON.stringify(ev)});}}catch(e){if(!this.closed)this.onerror?.(e);}if(!this.closed)this.timer=setTimeout(()=>this.poll(),250);}
   };
  }''')
  for asset in ['vendor/react.production.min.js','vendor/react-dom.production.min.js','app.bundle.js']:
   page.add_script_tag(content=(ROOT/'dist/web'/asset).read_text())

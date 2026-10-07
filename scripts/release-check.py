"""Verify a final ZIP by safe extraction, hashes, npm start and restart.
Only Python stdlib + installed Node/npm are required for API tests.
Optional Playwright/Chromium performs native-origin or explicitly labelled bridge UI smoke.
This script writes the final check OUTSIDE the immutable ZIP (no self-hash recursion).
"""
from pathlib import Path
from urllib.request import urlopen,Request
from urllib.error import HTTPError
import argparse,base64,hashlib,json,os,signal,socket,subprocess,sys,tempfile,time,zipfile,traceback
from datetime import datetime,timezone

parser=argparse.ArgumentParser();parser.add_argument('archive',type=Path);parser.add_argument('--report',type=Path);parser.add_argument('--skip-browser',action='store_true');args=parser.parse_args()
archive=args.archive.resolve();output=(args.report or archive.with_name(archive.stem+'-release-check.json')).resolve()
report={'archive':archive.name,'checkedAt':datetime.now(timezone.utc).isoformat(),'status':'running','checks':{},'limitations':[]}
process=None;log=None

def stop():
 global process,log
 if process:
  if process.poll() is None:
   if os.name=='posix':os.killpg(process.pid,signal.SIGTERM)
   else:process.terminate()
   try:process.wait(timeout=8)
   except subprocess.TimeoutExpired:
    if os.name=='posix':os.killpg(process.pid,signal.SIGKILL)
    else:process.kill()
    process.wait(timeout=5)
  process=None
 if log:log.close();log=None

try:
 assert archive.is_file(),'ZIP not found'
 report['bytes']=archive.stat().st_size;report['sha256']=hashlib.sha256(archive.read_bytes()).hexdigest()
 with tempfile.TemporaryDirectory(prefix='kontur-final-zip-') as temp:
  target=Path(temp)
  with zipfile.ZipFile(archive) as z:
   assert z.testzip() is None,'CRC failed';report['checks']['zipCRC']='passed';report['zipEntries']=len(z.infolist())
   for info in z.infolist():
    dest=(target/info.filename).resolve();assert dest.is_relative_to(target),'Unsafe ZIP path';assert not info.filename.startswith(('/', '\\'))
    assert (info.external_attr>>16)&0o170000 != 0o120000,'Symlinks not accepted'
   z.extractall(target)
  root=target/'kontur-teamspace';assert (root/'dist/server.mjs').is_file();assert not (root/'data').exists();report['checks']['freshExtraction']='passed'
  verification=subprocess.run(['npm','run','verify'],cwd=root,capture_output=True,text=True,timeout=15)
  report['hashVerificationStdout']=verification.stdout;assert verification.returncode==0,verification.stderr;report['checks']['fileHashes']='passed'
  with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
  base=f'http://127.0.0.1:{port}';cookie=''
  def raw(endpoint,payload=None,use_cookie=True):
   headers={'Content-Type':'application/json'}
   if cookie and use_cookie:headers['Cookie']=cookie
   req=Request(base+'/api/v1'+endpoint,data=json.dumps(payload).encode() if payload is not None else None,headers=headers,method='POST' if payload is not None else 'GET')
   try:res=urlopen(req,timeout=5)
   except HTTPError as e:res=e
   return res.status,json.loads(res.read()),res.headers
  def call(endpoint,payload=None):
   status,data,headers=raw(endpoint,payload);assert status==200,(endpoint,status,data);return data,headers
  def start(tag):
   global process,log
   env=os.environ.copy();env.update(PORT=str(port),HOST='127.0.0.1',DATA_DIR=str(target/'isolated-data'))
   log=open(target/f'{tag}.log','w');process=subprocess.Popen(['npm','start'],cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=os.name=='posix')
   for _ in range(60):
    if process.poll() is not None:raise RuntimeError((target/f'{tag}.log').read_text())
    try:
     health,_=call('/health');return health
    except Exception:time.sleep(.15)
   raise RuntimeError('Server did not become healthy')
  health=start('start');assert health['status']=='ok';report['node']=health['node'];report['checks']['npmStartWithoutInstall']='passed';report['checks']['health']='passed'
  session,headers=call('/demo/session',{'userId':'maxim'});cookie=headers['Set-Cookie'].split(';')[0]
  empty,_=call('/bootstrap');assert not empty['entities']['spaces'] and not empty['entities']['resources'] and not empty['entities']['releases'];report['checks']['emptyInitialState']='passed'
  envelope={'actionId':'release-check-create','type':'space.create','payload':{'name':'Archive smoke · persisted'}}
  created,_=call('/commands',envelope);space_id=created['commandResult']['id'];report['checks']['realHttpCommand']='passed'
  for asset in ['index.html','app.bundle.js','styles.css','vendor/react.production.min.js','vendor/react-dom.production.min.js']:
   with urlopen(base+'/'+asset,timeout=5) as res:assert res.status==200;data=res.read()
   assert hashlib.sha256(data).digest()==hashlib.sha256((root/'dist/web'/asset).read_bytes()).digest()
  report['checks']['servedFrontendMatchesZIP']='passed'
  if not args.skip_browser:
   try:
    from playwright.sync_api import sync_playwright,expect
    with sync_playwright() as p:
     browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1536,'height':960});page.set_default_timeout(8000)
     try:
      page.goto(base,timeout=5000,wait_until='domcontentloaded');expect(page.get_by_role('button',name='Создать пространство',exact=True).first).to_be_visible();report['checks']['nativeOriginUISmoke']='passed'
     except Exception as err:
      report['checks']['nativeOriginUISmoke']='blocked';report['nativeOriginError']=str(err);report['limitations'].append('Browser origin navigation failed; fallback is explicitly HTTP bridge, not proof of native browser cookies/storage/EventSource.')
      page.close();page=browser.new_page(viewport={'width':1536,'height':960});sys.path.insert(0,str(root/'tests'));import browser_bridge
      browser_bridge.BASE=base;bridge=browser_bridge.BrowserBridge();assert browser_bridge.ROOT==root;bridge.load(page);expect(page.get_by_role('button',name='Создать пространство',exact=True).first).to_be_visible();expect(page.get_by_role('heading',name='Archive smoke · persisted',exact=True)).to_be_visible();report['checks']['extractedUIHttpBridgeSmoke']='passed'
     report['browser']=browser.version;browser.close()
   except ImportError:
    report['checks']['browserSmoke']='not-run';report['limitations'].append('Optional Playwright is not installed. No browser test claimed.')
  else:report['checks']['browserSmoke']='not-run';report['limitations'].append('Browser test explicitly skipped.')
  stop();assert (target/'isolated-data/state.json').is_file();report['startupLog']=(target/'start.log').read_text()
  start('restart');restored,_=call('/bootstrap');assert any(s['id']==space_id for s in restored['entities']['spaces']);replayed,_=call('/commands',envelope);assert replayed['replayed'] and replayed['commandResult']['id']==space_id;assert len(restored['entities']['spaces'])==1;report['checks']['restartPersistenceAndIdempotency']='passed';stop()
 report['status']='passed-with-browser-transport-limitation' if report['limitations'] else 'passed';report['criteria']={'TS-099':'artifact/API/restart checks passed; browser transport qualification is explicit'}
except Exception as e:
 report['status']='failed';report['error']=str(e);report['traceback']=traceback.format_exc()
finally:
 stop();output.write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
if report['status']=='failed':sys.exit(1)

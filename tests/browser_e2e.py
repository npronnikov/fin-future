"""UI end-to-end driver. Default: native origin; set UI_BRIDGE=1 only on restricted stands.
Requires optional Python Playwright + Chromium. Application runtime has no such dependency.
All domain effects below are triggered by visible UI buttons/forms, not state injection.
"""
import json,os,sys,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from browser_bridge import BrowserBridge,BASE,ROOT
REPORT=ROOT/'reports/browser-results.json'; SHOTS=ROOT/'reports/screenshots';SHOTS.mkdir(exist_ok=True,parents=True)
results=[];errors=[];mode='HTTP-bridge (about:blank; bearer session; event polling)' if os.getenv('UI_BRIDGE')=='1' else 'native-origin'

def step(name,fn):
 start=time.monotonic()
 try:fn();results.append({'name':name,'status':'passed','durationMs':round((time.monotonic()-start)*1000)})
 except Exception as e:results.append({'name':name,'status':'failed','error':str(e),'traceback':traceback.format_exc()});raise
 print(name,results[-1]['status'],flush=True)

def main():
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=b.new_page(viewport={'width':1536,'height':960});page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)))
  bridge=BrowserBridge()
  if os.getenv('UI_BRIDGE')=='1':bridge.load(page)
  else:page.goto(BASE)
  def click(name,scope=None): (scope or page).get_by_role('button',name=name,exact=True).first.click()
  def nav(name):page.get_by_role('navigation').get_by_role('button',name=name,exact=False).click()
  def profile(id):
   expect(page.get_by_label('Демонстрационный профиль')).to_be_enabled();page.get_by_label('Демонстрационный профиль').select_option(id);expect(page.get_by_label('Демонстрационный профиль')).to_have_value(id);expect(page.get_by_label('Демонстрационный профиль')).to_be_enabled();expect(page.locator('.loading-screen')).to_have_count(0)
  def shot(name,full=False):page.screenshot(path=str(SHOTS/name),full_page=full)
  def no_overflow():assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
  try:
   def create_space():
    expect(page.get_by_role('button',name='Создать пространство',exact=True).first).to_be_visible();shot('01-empty-desktop.png');click('Создать пространство');page.get_by_label('Название команды').fill('UI · Команда цифровых сервисов');page.get_by_label('Общая цель').press_sequentially('Понятные статусы заявок',delay=8)
    expect(page.get_by_label('Общая цель')).to_have_value('Понятные статусы заявок');click('Создать пространство',page.get_by_role('dialog'));expect(page.get_by_role('heading',name='Подготовим рабочее пространство')).to_be_visible()
   step('UI-01: пустое создание через форму, роли, стабильный ввод',create_space)
   def infrastructure():
    click('Рассчитать план');click('Заказать и подготовить');click('Подтвердить заказ',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Установить основу',exact=True)).to_be_enabled(timeout=12000);click('Установить основу');expect(page.get_by_text('Основа готова. Создайте проект и подключите repo / CI / model.')).to_be_visible(timeout=12000);shot('02-setup-ready.png',True)
   step('UI-02: смета → явный заказ → ресурсы Ready → установка HG Ready',infrastructure)
   def project_bindings():
    profile('anna');nav('Проекты');click('Создать проект');click('Создать проект',page.get_by_role('dialog'));expect(page.get_by_role('heading',name='Статусы заявок',exact=True)).to_be_visible();profile('maxim');nav('Интеграции и доступы');click('Добавить подключение');click('Создать mock bindings',page.get_by_role('dialog'));expect(page.get_by_text('mock://repo',exact=True)).to_be_visible();profile('ivan');nav('Studio');click('Создать конфигурацию');click('Создать черновик',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Проверить граф',exact=True)).to_be_visible();click('Проверить граф');shot('03-studio.png')
   step('UI-03: проект PO → bindings платформы → исполняемый Flow инженера',project_bindings)
   def trial():
    click('Пробный запуск');click('Начать Trial',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Ответить и продолжить',exact=True)).to_be_visible(timeout=12000);click('Рабочий тред');page.get_by_label('Сообщение в канал').fill('Черновик сообщения, который не должен исчезнуть');click('Ответить');expect(page.get_by_role('heading',name='Уточнить и продолжить')).to_be_visible();page.get_by_label('Правило и пояснение для агента').fill('При HTTP 503 показывать недоступность источника, не пустой список.');click('Ответить и продолжить',page.get_by_role('dialog'));expect(page.get_by_role('dialog')).to_have_count(0);expect(page.get_by_label('Сообщение в канал')).to_have_value('Черновик сообщения, который не должен исчезнуть');expect(page.get_by_role('button',name='Открыть ревью',exact=True).first).to_be_visible(timeout=12000);shot('04-work-thread.png')
   step('UI-04: Trial без релиза → Input в треде → тот же Run, сохранённый composer draft',trial)
   def review_rework():
    click('Открыть ревью');expect(page.get_by_role('heading',name='Инженерное ревью')).to_be_visible();expect(page.get_by_text('Контракт не выполнен',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Принять просмотренную версию')).to_be_disabled();page.get_by_label('Причина Rework').fill('503 не означает пустую выдачу');page.get_by_label('Ожидаемое исправление').fill('Показать unavailable при HTTP 503, добавить regression test.');shot('05-review-desktop.png');click('Вернуть на доработку');expect(page.get_by_role('heading',name='Это правило пригодится команде?')).to_be_visible();
   step('UI-05: неверный diff → запрет approval → содержательный Rework',review_rework)
   def knowledge():
    click('Создать предложение знания',page.get_by_role('dialog'));expect(page.get_by_label('Содержимое страницы')).to_be_visible();expect(page.get_by_role('button',name='Опубликовать версию',exact=True)).to_be_disabled();profile('maria');nav('Знания');click('Опубликовать версию');expect(page.get_by_role('button',name='Подключить в Studio',exact=True)).to_be_visible();shot('06-knowledge.png');profile('ivan');nav('Studio');page.locator('.dependency-option').filter(has_text='503 не означает пустую выдачу').locator('input').check();click('Сохранить черновик');expect(page.get_by_role('button',name='Сохранить черновик',exact=True)).to_be_enabled();
   step('UI-06: Rework → знание → независимая публикация → явное подключение новой версии',knowledge)
   def knowledge_trial():
    click('Пробный запуск');page.get_by_label('Сценарий эмуляции').select_option('knowledge');click('Начать Trial',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Ответить и продолжить',exact=True)).to_be_visible(timeout=12000);page.set_viewport_size({'width':390,'height':844});click('Ответить и продолжить');expect(page.get_by_role('heading',name='Уточнить и продолжить')).to_be_visible();no_overflow();page.get_by_label('Правило и пояснение для агента').fill('Использовать опубликованное правило 503: отдельное unavailable.');shot('07-input-mobile.png');click('Ответить и продолжить',page.get_by_role('dialog'));expect(page.get_by_role('dialog')).to_have_count(0);expect(page.get_by_role('button',name='Открыть Workbench',exact=True).first).to_be_visible(timeout=12000);click('Открыть Workbench');expect(page.get_by_text('Контракт не выполнен',exact=True)).to_have_count(0);no_overflow();page.get_by_label('Я просмотрел эту версию изменений и результаты проверок.').check();shot('08-review-mobile.png');click('Принять просмотренную версию');expect(page.get_by_role('dialog')).to_have_count(0);page.set_viewport_size({'width':1536,'height':960});expect(page.get_by_role('button',name='Испытать конфигурацию',exact=True)).to_be_visible(timeout=12000)
   step('UI-07: новый snapshot с правилом → мобильный Input и корректное ревью на 390 px',knowledge_trial)
   def evaluate_candidate():
    click('Испытать конфигурацию');click('Выполнить evaluation',page.get_by_role('dialog'));expect(page.get_by_role('heading',name='Отчёт об испытаниях',exact=True)).to_be_visible();shot('09-evaluation.png');click('Подготовить кандидат');click('Подготовить кандидат',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Принять technical review',exact=True)).to_be_disabled();profile('maria');nav('Релизы');click('Принять technical review');expect(page.get_by_role('button',name='Принять область и риск',exact=True)).to_be_visible();profile('anna');nav('Релизы');click('Принять область и риск');expect(page.get_by_role('button',name='Подготовить UAT-среду',exact=True)).to_be_visible();profile('maxim');nav('Релизы');click('Подготовить UAT-среду');expect(page.get_by_role('button',name='Запустить UAT',exact=True)).to_be_visible();profile('ivan');nav('Релизы');click('Запустить UAT');expect(page.get_by_role('button',name='Ответить и продолжить',exact=True)).to_be_visible(timeout=12000);click('Ответить и продолжить');page.get_by_label('Правило и пояснение для агента').fill('UAT точного пакета: 503 означает unavailable, не empty.');click('Ответить и продолжить',page.get_by_role('dialog'));expect(page.get_by_role('button',name='Открыть Workbench',exact=True).first).to_be_visible(timeout=12000);click('Открыть Workbench');page.get_by_label('Я просмотрел эту версию изменений и результаты проверок.').check();click('Принять просмотренную версию');expect(page.get_by_role('dialog')).to_have_count(0);expect(page.locator('.run-toolbar .badge.good').first).to_be_visible(timeout=12000);nav('Релизы');click('Принять UAT-отчёт');expect(page.get_by_role('button',name='Допустить релиз',exact=True)).to_be_visible();profile('anna');nav('Релизы');click('Допустить релиз');expect(page.get_by_role('button',name='Разместить релиз',exact=True)).to_be_visible();profile('maxim');nav('Релизы');shot('10-release.png');click('Разместить релиз');click('Подтвердить размещение',page.get_by_role('dialog'));expect(page.get_by_text('Production',exact=True).first).to_be_visible();shot('11-environments.png')
   step('UI-08: evaluation → peer review → PO → UAT точного пакета → допуск → Deployment',evaluate_candidate)
   def mobile_rework_keyboard_offline():
    profile('ivan');nav('Human Inbox');page.set_viewport_size({'width':390,'height':844});click('Открыть пакет');expect(page.get_by_role('heading',name='Инженерное ревью')).to_be_visible();reason='Мобильное уточнение: сохранять состояние при повторном запросе.';page.get_by_label('Причина Rework').fill(reason);page.get_by_label('Ожидаемое исправление').fill('Сохранить отдельное unavailable и повтор запроса без потери состояния.');page.keyboard.press('Escape');expect(page.get_by_role('dialog')).to_have_count(0);expect(page.get_by_role('button',name='Открыть пакет',exact=True).first).to_be_focused();click('Открыть пакет');expect(page.get_by_label('Причина Rework')).to_have_value(reason);page.get_by_label('Я просмотрел эту версию изменений и результаты проверок.').check();page.get_by_role('button',name='Принять просмотренную версию',exact=True).focus();page.keyboard.press('Tab');assert page.evaluate("document.activeElement.closest('[role=dialog]')!==null");no_overflow()
    if os.getenv('UI_BRIDGE')=='1':
     bridge.online=False;page.evaluate("window.dispatchEvent(new Event('offline'))");page.wait_for_timeout(800);expect(page.get_by_role('button',name='Принять просмотренную версию',exact=True)).to_be_disabled();before=len(bridge.calls);page.get_by_role('button',name='Принять просмотренную версию',exact=True).dispatch_event('click');page.wait_for_timeout(300);assert len(bridge.calls)==before;bridge.online=True;page.evaluate("window.dispatchEvent(new Event('online'))");expect(page.get_by_role('button',name='Вернуть на доработку',exact=True)).to_be_enabled()
    shot('12-mobile-rework.png');click('Вернуть на доработку');expect(page.get_by_role('heading',name='Это правило пригодится команде?')).to_be_visible();click('Не сохранять');expect(page.get_by_role('dialog')).to_have_count(0);page.set_viewport_size({'width':768,'height':1024});no_overflow();page.set_viewport_size({'width':1536,'height':960})
   step('UI-09: 390 px Rework, сохранённый текст, Escape/focus, offline без скрытого approval',mobile_rework_keyboard_offline)
   def safe_content():
    nav('Сообщения');payload='<script>window.__konturXSS = 1</script>';page.get_by_label('Сообщение в канал').fill(payload);click('Отправить');expect(page.get_by_text(payload,exact=True)).to_be_visible();assert page.evaluate('typeof window.__konturXSS')=='undefined';nav('Мой день');shot('13-my-day.png');no_overflow()
   step('UI-10: script в сообщении отображается как текст, без исполнения',safe_content)
   assert not errors,errors
  except Exception:
   shot('failure-ui.png',True);raise
  finally:
   REPORT.write_text(json.dumps({'mode':mode,'browser':'Chromium '+b.version,'viewports':[[1536,960],[390,844],[768,1024]],'results':results,'pageErrors':errors,'limitations':['Native localhost origin blocked by browser administrator in this execution environment.','Bridge bypasses browser cookie/CORS/localStorage transport; it does not prove native-origin behavior.','Native SSE endpoint is tested separately by Node HTTP tests.'] if os.getenv('UI_BRIDGE')=='1' else [],'httpWriteCalls':bridge.calls},ensure_ascii=False,indent=2));b.close()
if __name__=='__main__':main()

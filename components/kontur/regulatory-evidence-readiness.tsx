'use client';
import {AlertTriangle, CheckCircle2, FileCheck, ShieldCheck} from 'lucide-react';
import {policyKey, type Item, type Policy, type Run} from '@/lib/domain';
import {useKontur} from './context';
import {DateText, Pill, Status, TextLink} from './ui';

type EvidenceReport = {run: Run; result: Item};

function valueText(value: unknown) {
  if (Array.isArray(value)) return value.join(' · ');
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

export default function RegulatoryEvidenceReadiness({policyKeys, runs}: {policyKeys: string[]; runs: Run[]}) {
  const {state, go} = useKontur();
  const policies = policyKeys.map(key => {
    const frozen = runs.flatMap(run => run.snapshot.policyPackages || []).find(policy => policyKey(policy) === key);
    return frozen || state.policies.find(policy => policyKey(policy) === key);
  }).filter((policy): policy is Policy => !!policy);
  const reports: EvidenceReport[] = runs.flatMap(run => ((run.evidence?.results || []) as Item[]).map(result => ({run, result})));
  const passed = reports.filter(report => report.result.status === 'PASS').length;
  const failed = reports.filter(report => report.result.status === 'FAIL').length;
  const readiness = failed ? 'FAIL' : reports.length && passed === reports.length ? 'PASS' : 'INCONCLUSIVE';

  return <section className="regulatory-evidence-readiness" aria-label="Регуляторные evidence из запусков">
    <header><span className={`regulatory-evidence-icon ${readiness.toLowerCase()}`}>{readiness === 'PASS' ? <CheckCircle2 size={21}/> : <AlertTriangle size={21}/>}</span><div><h3>Регуляторные проверки по запускам</h3><p>Отчёты сформированы verification skills в конце сохранённых запусков этой конфигурации.</p></div><Status value={readiness}/></header>
    <div className="regulatory-evidence-totals"><span><strong>{runs.length}</strong>запусков</span><span><strong>{reports.length}</strong>отчётов evidence</span><span><strong>{passed}</strong>PASS</span><span><strong>{failed}</strong>FAIL</span></div>
    <div className="regulatory-evidence-policies">{policies.map(policy => {
      const requirementKeys = policy.requirements.map(requirement => `${requirement.id}@${requirement.version}`);
      const policyReports = reports.filter(report => requirementKeys.includes(report.result.requirement));
      const policyFailed = policyReports.some(report => report.result.status === 'FAIL');
      const policyStatus = policyFailed ? 'FAIL' : policyReports.length && policyReports.every(report => report.result.status === 'PASS') ? 'PASS' : 'INCONCLUSIVE';
      return <article key={policyKey(policy)}><header><ShieldCheck size={17}/><div><strong>{policyKey(policy)}</strong><small>{policy.direction} · {policy.segment}</small></div><Status value={policyStatus}/></header>
        <div className="regulatory-evidence-requirements">{policy.requirements.map(requirement => {
          const requirementKey = `${requirement.id}@${requirement.version}`;
          const requirementReports = policyReports.filter(report => report.result.requirement === requirementKey).slice().reverse();
          const expected = policy.evidence.find(rule => rule.requirement === requirementKey);
          return <section key={requirementKey}><div className="regulatory-evidence-requirement-head"><span><FileCheck size={14}/><strong>{requirementKey}</strong></span>{requirementReports.length ? <Pill tone={requirementReports.some(report => report.result.status === 'FAIL') ? 'red' : 'green'}>{requirementReports.length} отч.</Pill> : <Pill tone="amber">Нет отчёта</Pill>}</div><p>{requirement.text}</p><small>Ожидаемая проверка: <span className="mono">{expected?.verificationSkill || 'не задана'}</span> · {expected?.artifacts || 'Evidence Rules package'}</small>
            {requirementReports.slice(0, 6).map(({run, result}) => <div className="regulatory-evidence-report" key={`${run.id}-${run.evidence?.id}-${requirementKey}`}><div><TextLink onClick={() => go('run', run.id, 'regulatory')}>{run.evidence?.id || `Evidence · ${run.id}`}</TextLink><small>{run.id} · <DateText value={run.evidence?.createdAt || run.completedAt || run.startedAt}/></small></div><Status value={result.status}/><p><span>Skill</span><b className="mono">{result.verificationSkill || expected?.verificationSkill || '—'}</b></p><p><span>Observed</span><b>{valueText(result.observed)}</b></p><p><span>Evidence</span><b>{valueText(result.evidence)}</b></p></div>)}
            {requirementReports.length > 6 && <small>Ещё отчётов: {requirementReports.length - 6}</small>}
          </section>;
        })}</div>
      </article>;
    })}{!policies.length && <div className="regulatory-evidence-empty"><AlertTriangle size={18}/><span>В конфигурации не найдены Policy Packages.</span></div>}</div>
    <p className="regulatory-evidence-source">Источник: Evidence Registry · Regulatory Evidence Report каждого Run. Компонент не пересчитывает и не подменяет результаты проверок.</p>
  </section>;
}

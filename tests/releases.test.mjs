import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, rejectsCode } from './helpers.mjs';
async function candidate(h) {
    const run = await h.trial();
    await h.accept(run);
    const evaluation = await h.cmd('ivan', 'evaluation.create', { snapshotId: run.snapshotId });
    const candidate = await h.cmd('ivan', 'candidate.create', { snapshotId: run.snapshotId, evaluationId: evaluation.id });
    return { run, evaluation, candidate };
}
async function admit(h, c) {
    c = await h.cmd('maria', 'candidate.technical', { targetDigest: c.manifestDigest }, c);
    c = await h.cmd('anna', 'candidate.scope', { targetDigest: c.manifestDigest }, c);
    const env = await h.cmd('maxim', 'environment.create', { sourceId: h.env.id, kind: 'UAT' });
    const run = await h.cmd('ivan', 'uat.start', { environmentId: env.id }, c);
    await h.accept(run);
    c = await h.entity('candidates', c.id);
    const report = await h.cmd('ivan', 'uat.accept', { targetDigest: c.manifestDigest }, c);
    const release = await h.cmd('anna', 'release.admit', {}, c.id);
    return { report, release, run };
}
test('TS-071 TS-072 TS-074 TS-075 TS-077: evaluation/mutation, arena not admission, immutable candidate and independent technical reviewer', async (t) => {
    const h = await harness(t);
    await h.setup();
    const { run, evaluation, candidate: c } = await candidate(h);
    assert.ok(evaluation.results.every(r => r.configurationDigest === run.configurationDigest));
    assert.equal(evaluation.mutation.wrongRejected, true);
    assert.ok(evaluation.results.some(r => r.provenance === 'declared-policy-fixture'));
    assert.ok(evaluation.limitations.length);
    const second = await h.cmd('ivan', 'evaluation.create', { snapshotId: run.snapshotId });
    const arena = await h.cmd('ivan', 'arena.compare', { evaluationIds: [evaluation.id, second.id] });
    assert.equal(arena.status, 'ReportOnly');
    assert.equal((await h.all('deployments')).length, 0);
    assert.equal((await h.all('releases')).length, 0);
    const locked = structuredClone(c.manifest);
    await rejectsCode(() => h.cmd('ivan', 'candidate.technical', { targetDigest: c.manifestDigest }, c), 'Forbidden');
    await rejectsCode(() => h.cmd('maria', 'candidate.technical', { targetDigest: 'wrong' }, c), 'StaleReview');
    const next = await h.cmd('maria', 'candidate.technical', { targetDigest: c.manifestDigest }, c);
    assert.equal(next.status, 'ScopeReview');
    assert.deepEqual(next.manifest, locked);
});
test('TS-078 TS-079: UAT exact snapshot, explicit admission and idempotent scoped deployment', async (t) => {
    const h = await harness(t);
    await h.setup();
    const { candidate: c } = await candidate(h);
    let scoped = await h.cmd('maria', 'candidate.technical', { targetDigest: c.manifestDigest }, c);
    scoped = await h.cmd('anna', 'candidate.scope', { targetDigest: c.manifestDigest }, scoped);
    const uat = await h.cmd('maxim', 'environment.create', { sourceId: h.env.id, kind: 'UAT' });
    await rejectsCode(() => h.cmd('ivan', 'uat.start', { snapshotId: 'replacement', environmentId: uat.id }, scoped), 'StaleReview');
    const r = await h.cmd('ivan', 'uat.start', { environmentId: uat.id }, scoped);
    assert.equal(r.snapshotId, c.snapshotId);
    await h.accept(r);
    const report = await h.cmd('ivan', 'uat.accept', { targetDigest: c.manifestDigest }, c.id);
    assert.equal(report.configurationDigest, c.configurationDigest);
    const release = await h.cmd('anna', 'release.admit', {}, c.id);
    const env = await h.cmd('maxim', 'environment.create', { sourceId: h.env.id, kind: 'Production' });
    await rejectsCode(() => h.cmd('ivan', 'deployment.create', { releaseId: release.id, environmentId: env.id }), 'Forbidden');
    const envelope = { actionId: 'deploy-idempotent', type: 'deployment.create', spaceId: h.spaceId, payload: { releaseId: release.id, environmentId: env.id } };
    const a = await h.api('maxim', '/commands', envelope), b = await h.api('maxim', '/commands', envelope);
    assert.deepEqual(a.commandResult, b.commandResult);
    assert.equal(b.replayed, true);
    assert.equal((await h.all('deployments')).length, 1);
    const live = await h.cmd('ivan', 'run.startReleased', { deploymentId: a.commandResult.id, environmentId: env.id, projectId: h.project.id, fixture: 'clean' });
    assert.equal(live.configurationDigest, c.configurationDigest);
    assert.equal(live.mode, 'released');
});
test('TS-076: team candidate pins coordinator, routing, specialists and delegation limits (single-class admission scope)', async (t) => {
    const h = await harness(t);
    await h.setup({ profile: 'agents', kind: 'team' });
    const { candidate: c } = await candidate(h);
    assert.equal(c.manifest.kind, 'AssistantTeamRelease');
    assert.ok(c.manifest.team.coordinator);
    assert.ok(c.manifest.team.routing.ui);
    assert.ok(c.manifest.team.routing.docs);
    assert.equal(c.manifest.team.limits.concurrency, 2);
    assert.equal(c.manifest.taskClass, 'ui'); // This build does not claim multi-class UAT admission.
});
test('TS-069 TS-070: exact component consumers, revoke stops dependent work and prevents unsafe rollback', async (t) => {
    const h = await harness(t);
    await h.setup();
    let { version } = await h.cmd('ivan', 'component.create', { name: 'Правило 503' });
    version = await h.cmd('ivan', 'component.submit', {}, version);
    version = await h.cmd('maria', 'component.publish', {}, version);
    h.def = await h.cmd('ivan', 'definition.save', { dependencies: [version.id] }, h.def);
    const { candidate: c } = await candidate(h);
    const { release } = await admit(h, c);
    const prod = await h.cmd('maxim', 'environment.create', { sourceId: h.env.id, kind: 'Production' });
    const deployment = await h.cmd('maxim', 'deployment.create', { releaseId: release.id, environmentId: prod.id });
    const r = await h.trial();
    await h.until(r.id);
    assert.ok((await h.all('snapshots')).some(s => s.lock.some(v => v.id === version.id && v.contentDigest === version.contentDigest)));
    await h.cmd('ivan', 'component.revoke', { reason: 'Тестовый отзыв знания' }, version.id);
    assert.equal((await h.entity('runs', r.id)).status, 'Blocked');
    await rejectsCode(() => h.cmd('maxim', 'deployment.control', { action: 'rollback', releaseId: release.id }, deployment), 'MissingDependency');
});
test('TS-073 TS-080 TS-085 TS-086 TS-087: distinct release types, honest cohort, product outcome and explicit improvement', async (t) => {
    const h = await harness(t);
    await h.setup();
    const good = await h.trial();
    await h.accept(good);
    const pending = await h.trial();
    const cancelled = await h.trial();
    await h.cmd('ivan', 'run.control', { control: 'CANCEL' }, cancelled);
    const metrics = (await h.boot()).metrics;
    assert.equal(metrics.started, 3);
    assert.equal(metrics.accepted, 1);
    assert.equal(metrics.cancelled, 1);
    assert.equal(metrics.pending, 1);
    let product = await h.cmd('ivan', 'productRelease.create', { runId: good.id });
    await rejectsCode(() => h.cmd('maxim', 'productRelease.deploy', {}, product), 'Forbidden');
    product = await h.cmd('anna', 'productRelease.approve', {}, product);
    product = await h.cmd('maxim', 'productRelease.deploy', {}, product);
    const platform = await h.cmd('maxim', 'platformRelease.create', { installationId: h.inst.id });
    assert.equal(platform.status, 'Draft');
    assert.ok(platform.limitations.length);
    assert.equal((await h.all('releases')).length, 0);
    const outcome = await h.cmd('anna', 'outcome.observe', { productReleaseId: product.id });
    assert.ok(outcome.metricContract);
    assert.equal(outcome.maturity, 'complete');
    assert.match(outcome.provenance, /synthetic/);
    await rejectsCode(() => h.cmd('anna', 'outcome.improve', { confirm: false }, outcome), 'ValidationError');
    const improvement = await h.cmd('anna', 'outcome.improve', { confirm: true }, outcome);
    assert.equal(improvement.task.originOutcomeId, outcome.id);
    assert.equal(improvement.task.status, 'Backlog');
    for (const fixture of ['srm', 'guardrail', 'immature']) {
        const invalid = await h.cmd('anna', 'outcome.observe', { productReleaseId: product.id, fixture });
        await rejectsCode(() => h.cmd('anna', 'outcome.scale', {}, invalid), 'ValidationError');
    }
});

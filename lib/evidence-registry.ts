import {policyKey, type Item, type State} from './domain.ts';

export const EVIDENCE_REGISTRY_NAME = 'Evidence Registry';

export interface EvidenceRegistryRecord {
  id: string;
  evidenceId: string;
  runId: string;
  taskId: string;
  taskTitle: string;
  capabilityId: string;
  productId: string;
  productName: string;
  teamId: string;
  teamName: string;
  policyPackage: string;
  policyDirection: string;
  segment: string;
  requirement: string;
  status: string;
  verificationSkill: string;
  runtime: string;
  subagents: string[];
  observed: unknown;
  artifacts: unknown;
  requiredArtifacts: unknown;
  createdAt: string;
}

export interface EvidenceRegistryFilters {
  policyPackage?: string;
  requirement?: string;
  taskId?: string;
  runId?: string;
  status?: string;
  teamId?: string;
  productId?: string;
  directions?: string[];
}

export function evidenceRegistryRecords(state: State): EvidenceRegistryRecord[] {
  const records = state.runs.flatMap(run => {
    if (!run.evidence) return [];
    const task = state.tasks.find(item => item.id === run.taskId);
    return ((run.evidence.results || []) as Item[]).map((result, index) => {
      const policy = (run.snapshot.policyPackages || []).find(candidate => candidate.requirements.some(requirement => `${requirement.id}@${requirement.version}` === result.requirement));
      return {
        id: `${run.evidence!.id}:${result.requirement || index}`,
        evidenceId: run.evidence!.id,
        runId: run.id,
        taskId: run.taskId,
        taskTitle: task?.title || run.taskId,
        capabilityId: run.capabilityId,
        productId: run.productId,
        productName: run.snapshot.productName,
        teamId: run.teamId,
        teamName: run.snapshot.teamName,
        policyPackage: policy ? policyKey(policy) : 'UNRESOLVED',
        policyDirection: policy?.direction || 'Unknown',
        segment: policy?.segment || '',
        requirement: result.requirement || 'UNRESOLVED',
        status: result.status || run.evidence!.status || 'INCONCLUSIVE',
        verificationSkill: result.verificationSkill || '',
        runtime: run.snapshot.runtime,
        subagents: [...(result.subagents || [])],
        observed: result.observed,
        artifacts: result.evidence,
        requiredArtifacts: result.requiredArtifacts,
        createdAt: run.evidence!.createdAt || run.completedAt || run.startedAt,
      };
    });
  });
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id));
}

export function filterEvidenceRegistry(records: EvidenceRegistryRecord[], filters: EvidenceRegistryFilters) {
  return records.filter(record =>
    (!filters.policyPackage || record.policyPackage === filters.policyPackage) &&
    (!filters.requirement || record.requirement === filters.requirement) &&
    (!filters.taskId || record.taskId === filters.taskId) &&
    (!filters.runId || record.runId === filters.runId) &&
    (!filters.status || record.status === filters.status) &&
    (!filters.teamId || record.teamId === filters.teamId) &&
    (!filters.productId || record.productId === filters.productId) &&
    (!filters.directions?.length || filters.directions.includes(record.policyDirection))
  );
}

export function evidenceRegistrySummary(records: EvidenceRegistryRecord[]) {
  return {
    reports: new Set(records.map(record => record.evidenceId)).size,
    checks: records.length,
    pass: records.filter(record => record.status === 'PASS').length,
    fail: records.filter(record => record.status === 'FAIL').length,
    tasks: new Set(records.map(record => record.taskId)).size,
    policyPackages: new Set(records.map(record => record.policyPackage)).size,
    lastReceivedAt: records[0]?.createdAt || null,
  };
}

export type HumanRole = 'po' | 'engineer' | 'platform';
export type RunState = 'Created' | 'Queued' | 'Running' | 'WaitingInput' | 'WaitingApproval' | 'Reworking' | 'Paused' | 'InDoubt' | 'TakeoverRequested' | 'HumanOwned' | 'Blocked' | 'Accepted' | 'Failed' | 'Cancelled';
export type GateState = 'Pending' | 'Answered' | 'Approved' | 'ReworkRequested' | 'Rejected' | 'Expired' | 'Superseded' | 'Cancelled';
export interface User {
    id: string;
    name: string;
    role: HumanRole;
    title: string;
    initials: string;
}
export interface Entity {
    id: string;
    type: string;
    spaceId: string;
    projectId?: string;
    revision: number;
    createdAt: number;
    updatedAt: number;
    createdBy: string;
    [key: string]: any;
}
export interface Command<T = Record<string, unknown>> {
    actionId: string;
    type: string;
    spaceId?: string;
    projectId?: string;
    targetId?: string;
    expectedRevision?: number;
    payload: T;
}
export interface NodeDefinition {
    id: string;
    type: 'Start' | 'AI' | 'Command' | 'Input' | 'Approval' | 'Condition' | 'Delegation' | 'Parallel' | 'Join' | 'Terminal';
    label: string;
    x?: number;
    y?: number;
    [key: string]: any;
}
export interface FlowGraph {
    schemaVersion: 1;
    nodes: NodeDefinition[];
    edges: {
        from: string;
        to: string;
        on: string;
        maxVisits?: number;
    }[];
    metadata?: Record<string, unknown>;
    dependencies?: string[];
}
export interface ReviewChallenge extends Entity {
    userId: string;
    gateId: string;
    expectedRevision: number;
    artifactBundleDigest: string;
    allowedActions: string[];
    expiresAt: number;
}
export interface Bootstrap {
    user: User;
    entities: Record<string, Entity[]>;
    sequence: number;
    catalog: any;
    metrics: any;
    simulator: any;
    recovery: any;
    clock: number;
}

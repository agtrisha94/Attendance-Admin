// src/lib/events.ts
// Tiny in-memory event bus used to notify UI pieces about cross-page updates.
export const AppEvents = new EventTarget();

/**
 * Helper to dispatch assignment updates
 * detail: { teacherId: string, assignment?: { assignedProgram?, assignedBranch?, assignedYear?, assignedClassId? } }
 */
export const emitAssignmentUpdate = (detail: any) => {
  AppEvents.dispatchEvent(new CustomEvent("assignments:updated", { detail }));
};

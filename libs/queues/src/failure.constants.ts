/** Demo identifiers — use in curl payloads or job data to force failures. */
export const DEMO_FAIL_USER_ENQUEUE = 'usr_fail_enqueue';
export const DEMO_FAIL_USER_WORKER = 'usr_fail_worker';
export const DEMO_FAIL_SKU = 'sku_fail';

export type JobFailureMode = 'enqueue' | 'worker';

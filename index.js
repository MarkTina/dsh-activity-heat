/**
 * @local/activity-heat — Host half (no-op).
 *
 * Everything this plugin does lives in the browser half (client.js): the
 * sidebar panel entry, the persistent heat underline under each session title and the hover-card heat section.
 * This module exists only so the loader entry mounts the package, which lets
 * dsh-client-modules pick up the `dsh.client` declaration and serve the
 * browser artifact to the page. No Host service, session event or projection
 * is involved, so the plugin can never refuse to mount a Session.
 */

/** Plugin identity for loader rows. */
export const name = '@local/activity-heat';

/** Host loader entry: nothing to mount on the server side. */
export function apply() {}

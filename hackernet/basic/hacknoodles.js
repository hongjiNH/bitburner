/** @param {NS} ns */
export async function main(ns) {
    const target = "n00dles";

    if (!ns.hasRootAccess(target)) {
        ns.tprint(`[🛡️] No root access on ${target}. Attempting to nuke...`);
        try {
            ns.nuke(target);
        } catch (e) {
            ns.tprint("[❌] Failed to nuke. You probably don't have NUKE.exe.");
            return;
        }
    }

    while (true) {
        await ns.hack(target);
    }
}

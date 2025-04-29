/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0] || "n00dles"; // Default target if no argument is provided
    const minSecurityLevel = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);
    
    // Ensure all required ports are open (nuke if needed)
    if (!ns.hasRootAccess(target)) {
        // Check if we have the required programs to nuke the target
        if (ns.fileExists("NUKE.exe")) {
            ns.tprint(`🔓 Nuke ${target}`);
            await ns.nuke(target);
        } else {
            ns.tprint(`❌ Cannot nuke ${target} - no NUKE.exe`);
            return;
        }
    }

    // Main loop to hack, weaken, and grow
    while (true) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const currentMoney = ns.getServerMoneyAvailable(target);

        // Get running scripts on the target server
        const runningScripts = ns.ps(target); // Get all running scripts on the target server

        // Kill any scripts that are not your own
        for (const script of runningScripts) {
            // Kill only scripts that are not part of your predefined scripts
            if (script.filename !== "basicHackScript.js" && 
                script.filename !== "basicWeakenScript.js" && 
                script.filename !== "basicGrowScript.js") {
                ns.kill(script.pid); // Kill the script
                ns.tprint(`🛑 Killed script ${script.filename} on ${target}`);
            }
        }

        // If security is high, weaken it
        if (currentSecurity > minSecurityLevel + 0.1) {
            ns.tprint(`⚠️ Weaken ${target} - Security: ${currentSecurity}`);
            await ns.weaken(target);
        }
        
        // If money is low, grow it
        if (currentMoney < maxMoney * 0.9) {
            ns.tprint(`💰 Growing ${target} - Money: ${currentMoney}`);
            await ns.grow(target);
        }

        // Hack when security is low and money is available
        if (currentSecurity <= minSecurityLevel && currentMoney >= maxMoney * 0.75) {
            ns.tprint(`💸 Hacking ${target} - Money: ${currentMoney}`);
            await ns.hack(target);
        }

        // Sleep to prevent spamming actions too quickly
        await ns.sleep(1000);
    }
}

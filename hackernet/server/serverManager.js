/** @param {NS} ns **/
export async function main(ns) {
    const target = "sigma-cosmetics"; // Start with easy target
    const script = "basicHackScript.js"; // Name of the hacking script (make sure you have it)
    const minRam = 16; // Minimum RAM (GB) for new servers
    const maxServers = ns.getPurchasedServerLimit(); // Max number of servers you can own
    const serverPrefix = "auto"; // Name for servers

    // Ensure all required scripts are present
    await ensureScripts(ns, ["basicHackScript.js", "basicWeakenScript.js", "basicGrowScript.js"]);

    while (true) {
        const servers = ns.getPurchasedServers();
        const money = ns.getServerMoneyAvailable("home");

        // 1. Purchase new server if we have less than max
        if (servers.length < maxServers) {
            const cost = ns.getPurchasedServerCost(minRam);
            if (money > cost) {
                const hostname = ns.purchaseServer(`${serverPrefix}-${servers.length}`, minRam);
                ns.tprint(`🚀 Purchased new server: ${hostname} (${minRam}GB)`);
            }
        }
        
        // 2. Upgrade existing servers
        else {
            let weakestServer = servers[0];
            let weakestRam = ns.getServerMaxRam(weakestServer);

            for (const server of servers) {
                const ram = ns.getServerMaxRam(server);
                if (ram < weakestRam) {
                    weakestRam = ram;
                    weakestServer = server;
                }
            }

            const upgradeRam = weakestRam * 2;
            const upgradeCost = ns.getPurchasedServerCost(upgradeRam);

            if (upgradeRam <= 1024 && money > upgradeCost) { // 1024GB = max purchasable RAM
                ns.killall(weakestServer);  // Kill all running scripts on the weakest server
                ns.deleteServer(weakestServer);
                const hostname = ns.purchaseServer(weakestServer, upgradeRam);
                ns.tprint(`🔧 Upgraded server: ${hostname} to ${upgradeRam}GB`);
            }
        }

        // 3. Kill scripts on all servers that are not the target script
        for (const server of ns.getPurchasedServers()) {
            const runningScripts = ns.ps(server);
            const targetScriptRunning = runningScripts.some(script => script.args[0] === target);
            // If the target script is NOT already running, kill other scripts
            if (!targetScriptRunning) {
                for (const script of runningScripts) {
                    ns.kill(script.pid); // Kill any script that is not the target script
                    ns.tprint(`🛑 Killed script: ${script.filename} on ${server}`);
                }
            }

            // Now, deploy the target script to the server
            const maxRam = ns.getServerMaxRam(server);
            const usedRam = ns.getServerUsedRam(server);
            const availableRam = maxRam - usedRam;
            const scriptRam = ns.getScriptRam(script, "home");

            if (availableRam >= scriptRam) {
                const threads = Math.floor(availableRam / scriptRam);
                await ns.scp(script, server, "home");
                ns.exec(script, server, threads, target);
                ns.tprint(`🚀 Deployed ${script} x${threads} on ${server} targeting ${target}`);
            }
        }

        await ns.sleep(1000); // Wait 1 minute before checking again
    }
}

// Helper function to ensure that the necessary scripts exist
async function ensureScripts(ns, scripts) {
    for (const script of scripts) {
        if (!ns.fileExists(script, "home")) {
            ns.tprint(`❌ Script ${script} not found on home! Creating...`);
            await createScript(ns, script);
        } else {
            ns.tprint(`✅ Script ${script} already exists on home.`);
        }
    }
}

// Helper function to create a script if missing
async function createScript(ns, scriptName) {
    let scriptContent = "";
    if (scriptName === "basicHackScript.js") {
        scriptContent = `/** @param {NS} ns **/
        export async function main(ns) {
            const target = ns.args[0] || "n00dles"; // Default to "n00dles"
            await ns.hack(target);
        }`;
    } else if (scriptName === "basicWeakenScript.js") {
        scriptContent = `/** @param {NS} ns **/
        export async function main(ns) {
            const target = ns.args[0] || "n00dles"; // Default to "n00dles"
            await ns.weaken(target);
        }`;
    } else if (scriptName === "basicGrowScript.js") {
        scriptContent = `/** @param {NS} ns **/
        export async function main(ns) {
            const target = ns.args[0] || "n00dles"; // Default to "n00dles"
            await ns.grow(target);
        }`;
    } else {
        ns.tprint(`❌ Script ${scriptName} not recognized!`);
        return;
    }
    
    // Write the script to disk
    await ns.write(scriptName, scriptContent);
    ns.tprint(`🚀 Created missing script: ${scriptName}`);
}

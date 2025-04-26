/** @param {NS} ns */
export async function main(ns) {
  const sleepTime = 60000; // Sleep 1 min after each action
  const nodes = ns.hacknet.numNodes.bind(ns.hacknet);
  const getMoney = ns.getServerMoneyAvailable.bind(ns);
  const purchaseNodeCost = ns.hacknet.getPurchaseNodeCost.bind(ns.hacknet);

  while (true) {
    let money = getMoney("home");
    let numNodes = nodes();

    let bestAction = null;
    let bestROI = 0;
    let cheapestUpgradeCost = Infinity;

    // 🌟 Calculate total production per minute
    let totalProductionPerMinute = 0;
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      totalProductionPerMinute += stats.production * 60;
    }

    // 🔥 Check all upgrades
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      const baseProduction = stats.production;

      // LEVEL UPGRADE
      let levelUpgradeCost = 0;
      let levelCount = 0;
      while (money >= levelUpgradeCost + ns.hacknet.getLevelUpgradeCost(i, 1)) {
        levelUpgradeCost += ns.hacknet.getLevelUpgradeCost(i, 1);
        levelCount++;
      }
      if (levelCount > 0) {
        const newProduction = baseProduction + levelCount;
        const roi = (newProduction - baseProduction) / levelUpgradeCost;
        if (roi > bestROI) {
          bestROI = roi;
          bestAction = { type: "level", node: i, cost: levelUpgradeCost, name: "LEVEL", upgrade: levelCount };
        }
        cheapestUpgradeCost = Math.min(cheapestUpgradeCost, levelUpgradeCost);
      }

      // RAM UPGRADE
      let ramUpgradeCost = 0;
      let ramCount = 0;
      while (money >= ramUpgradeCost + ns.hacknet.getRamUpgradeCost(i, 1)) {
        ramUpgradeCost += ns.hacknet.getRamUpgradeCost(i, 1);
        ramCount++;
      }
      if (ramCount > 0) {
        const newProduction = baseProduction * (1.05 ** ramCount); // RAM scales multiplicatively
        const roi = (newProduction - baseProduction) / ramUpgradeCost;
        if (roi > bestROI) {
          bestROI = roi;
          bestAction = { type: "ram", node: i, cost: ramUpgradeCost, name: "RAM", upgrade: ramCount };
        }
        cheapestUpgradeCost = Math.min(cheapestUpgradeCost, ramUpgradeCost);
      }

      // CORE UPGRADE
      let coreUpgradeCost = 0;
      let coreCount = 0;
      while (money >= coreUpgradeCost + ns.hacknet.getCoreUpgradeCost(i, 1)) {
        coreUpgradeCost += ns.hacknet.getCoreUpgradeCost(i, 1);
        coreCount++;
      }
      if (coreCount > 0) {
        const newProduction = baseProduction + coreCount * 5;
        const roi = (newProduction - baseProduction) / coreUpgradeCost;
        if (roi > bestROI) {
          bestROI = roi;
          bestAction = { type: "core", node: i, cost: coreUpgradeCost, name: "CORE", upgrade: coreCount };
        }
        cheapestUpgradeCost = Math.min(cheapestUpgradeCost, coreUpgradeCost);
      }
    }

    // 🆕 New node check
    const nodeCost = purchaseNodeCost();
    if (nodeCost !== Infinity && nodeCost <= cheapestUpgradeCost && money >= 2 * nodeCost) {
      const productionEstimate = 1; // New nodes start weak
      const roi = productionEstimate / nodeCost;
      if (roi > bestROI) {
        bestROI = roi;
        bestAction = { type: "new-node", cost: nodeCost, name: "NEW NODE" };
      }
    }

    // 🛠️ Execute action
    if (bestAction) {
      if (money >= bestAction.cost) {
        ns.tprint(`[🚀] Upgrading: ${bestAction.name} | Node: ${bestAction.node ?? "N/A"} | Cost: \$${bestAction.cost.toLocaleString()} | Upgrades: ${bestAction.upgrade ?? "1"}`);
        if (bestAction.type === "level") {
          for (let j = 0; j < bestAction.upgrade; j++) {
            const cost = ns.hacknet.getLevelUpgradeCost(bestAction.node, 1);
            if (money >= cost) {
              ns.hacknet.upgradeLevel(bestAction.node, 1);
              money -= cost;
            } else {
              break;
            }
          }
        } else if (bestAction.type === "ram") {
          for (let j = 0; j < bestAction.upgrade; j++) {
            const cost = ns.hacknet.getRamUpgradeCost(bestAction.node, 1);
            if (money >= cost) {
              ns.hacknet.upgradeRam(bestAction.node, 1);
              money -= cost;
            } else {
              break;
            }
          }
        } else if (bestAction.type === "core") {
          for (let j = 0; j < bestAction.upgrade; j++) {
            const cost = ns.hacknet.getCoreUpgradeCost(bestAction.node, 1);
            if (money >= cost) {
              ns.hacknet.upgradeCore(bestAction.node, 1);
              money -= cost;
            } else {
              break;
            }
          }
        } else if (bestAction.type === "new-node") {
          ns.hacknet.purchaseNode();
        }

      } else {
        const timeNeeded = (bestAction.cost - money) / totalProductionPerMinute;
        ns.tprint(`[⏳] Waiting for \$${(bestAction.cost - money).toLocaleString()} more. Estimated wait time: ${timeNeeded.toFixed(2)} minutes.`);
        await ns.sleep(sleepTime);
        continue;
      }
    } else {
      ns.tprint("[💤] No upgrade possible. Sleeping...");
    }

    // 💤 Sleep after action
    await ns.sleep(sleepTime);
  }
}

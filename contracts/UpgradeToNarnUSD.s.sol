// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.26;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { NarnUSD } from "../../src/projects/earnerManager/NarnUSD.sol";
import { ScriptBase } from "../ScriptBase.s.sol";

interface IProxyAdmin {
    function upgradeAndCall(address proxy, address implementation, bytes memory data) external;
}

contract UpgradeToNarnUSD is Script, ScriptBase {
    function run() public {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        DeployConfig memory config = _getDeployConfig(block.chainid);

        vm.startBroadcast(deployer);

        // Deploy new NarnUSD implementation
        NarnUSD newImplementation = new NarnUSD(config.mToken, _getSwapFacility());

        console.log("New NarnUSD implementation:", address(newImplementation));

        // Upgrade proxy to new implementation (no initializer needed — new storage defaults to zero)
        address proxy = vm.envAddress("PROXY");
        address proxyAdmin = vm.envAddress("PROXY_ADMIN");

        IProxyAdmin(proxyAdmin).upgradeAndCall(proxy, address(newImplementation), "");

        console.log("Proxy upgraded:", proxy);
        console.log("ProxyAdmin:", proxyAdmin);

        vm.stopBroadcast();
    }
}

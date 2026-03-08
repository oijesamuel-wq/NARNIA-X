// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.26;

import { MEarnerManager } from "./MEarnerManager.sol";

/**
 * @title  NarnUSD (nUSD) — MEarnerManager extension with autoburn, credit scoring, and agent registry.
 * @author NARNIA X
 * @notice Inherits MEarnerManager and adds:
 *         1. Autoburn: 0.10% (10 bps) burn on every transfer
 *         2. CreditProfile: per-address on-chain transaction history for NEXUS AI
 *         3. Agent Registry: flagging whitelisted addresses as remittance corridor operators
 */
contract NarnUSD is MEarnerManager {
    /* ============ NarnUSD Storage (ERC-7201) ============ */

    struct CreditProfile {
        uint64  totalTransactions;
        uint128 totalVolumeTransferred;
        uint64  firstTransactionTime;
        uint64  lastTransactionTime;
        uint32  consecutiveWeeksActive;
        uint32  lastActiveWeek;
    }

    /// @custom:storage-location erc7201:NarniaX.storage.NarnUSD
    struct NarnUSDStorage {
        uint256 totalBurned;
        uint256 agentCount;
        mapping(address => CreditProfile) creditProfiles;
        mapping(address => bool) isAgent;
    }

    // keccak256(abi.encode(uint256(keccak256("NarniaX.storage.NarnUSD")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant _NARN_USD_STORAGE_LOCATION =
        0x60271a7d44f8a059138c8a9cd1c672da4e93c58d70e89ab4007e1c631c91ea00;

    function _getNarnUSDStorage() internal pure returns (NarnUSDStorage storage $) {
        assembly {
            $.slot := _NARN_USD_STORAGE_LOCATION
        }
    }

    /* ============ Constants ============ */

    uint16 public constant AUTOBURN_BPS = 10;
    uint16 private constant BPS_DENOMINATOR = 10_000;

    /* ============ Events ============ */

    event AutoBurned(address indexed from, uint256 amount, uint256 totalBurnedCumulative);
    event CreditProfileUpdated(address indexed account, uint64 totalTx, uint128 totalVol);
    event AgentRegistered(address indexed account, bool status);

    /* ============ Errors ============ */

    error AgentMustBeWhitelisted();

    /* ============ Constructor ============ */

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address mToken_, address swapFacility_) MEarnerManager(mToken_, swapFacility_) {}

    /* ============ Transfer Override — Autoburn + Credit Profiles ============ */

    /**
     * @dev Overrides MEarnerManager._update to add autoburn and credit profile tracking.
     *      Called on every transfer (not mint/burn — those go through _mint/_burn directly).
     */
    function _update(address sender, address recipient, uint256 amount) internal override {
        // 1. Execute the base transfer (balance + principal updates)
        super._update(sender, recipient, amount);

        // 2. Autoburn — burn 0.10% from recipient's received amount
        if (amount > 0) {
            uint256 burnAmount = (amount * AUTOBURN_BPS) / BPS_DENOMINATOR;
            if (burnAmount > 0) {
                _burn(recipient, burnAmount);

                NarnUSDStorage storage ns = _getNarnUSDStorage();
                unchecked {
                    ns.totalBurned += burnAmount;
                }

                emit AutoBurned(sender, burnAmount, ns.totalBurned);
            }
        }

        // 3. Update credit profiles for both sender and recipient
        uint64 currentTime = uint64(block.timestamp);
        uint32 currentWeek = uint32(block.timestamp / 604800);

        _updateCreditProfile(sender, amount, currentTime, currentWeek);
        _updateCreditProfile(recipient, amount, currentTime, currentWeek);
    }

    /* ============ Credit Profile ============ */

    function _updateCreditProfile(
        address account,
        uint256 amount,
        uint64 currentTime,
        uint32 currentWeek
    ) internal {
        CreditProfile storage profile = _getNarnUSDStorage().creditProfiles[account];

        if (profile.firstTransactionTime == 0) {
            profile.firstTransactionTime = currentTime;
        }

        unchecked {
            profile.totalTransactions++;
            profile.totalVolumeTransferred += uint128(amount);
        }

        profile.lastTransactionTime = currentTime;

        // Consecutive weeks: increment if next week, reset if gap
        if (currentWeek == profile.lastActiveWeek + 1) {
            unchecked { profile.consecutiveWeeksActive++; }
        } else if (currentWeek > profile.lastActiveWeek + 1) {
            profile.consecutiveWeeksActive = 1;
        }
        // Same week → no change to streak

        profile.lastActiveWeek = currentWeek;

        emit CreditProfileUpdated(account, profile.totalTransactions, profile.totalVolumeTransferred);
    }

    /// @notice Credit tier: 0=New, 1=Starter, 2=Established, 3=Reliable, 4=Premium
    function getCreditTier(address account) external view returns (uint8) {
        CreditProfile storage p = _getNarnUSDStorage().creditProfiles[account];
        uint32 w = p.consecutiveWeeksActive;
        uint128 v = p.totalVolumeTransferred;
        if (w >= 52 && v >= 1_000_000e6) return 4;
        if (w >= 27 && v >= 100_000e6) return 3;
        if (w >= 13 && v >= 10_000e6) return 2;
        if (w >= 4) return 1;
        return 0;
    }

    /// @notice Returns the full credit profile for a single account.
    function creditProfileOf(address account) external view returns (CreditProfile memory) {
        return _getNarnUSDStorage().creditProfiles[account];
    }

    /* ============ Agent Registry ============ */

    /// @notice Set or remove agent status for a whitelisted account.
    function setAgent(address account, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!isWhitelisted(account)) revert AgentMustBeWhitelisted();

        NarnUSDStorage storage ns = _getNarnUSDStorage();
        if (ns.isAgent[account] == status) return;

        ns.isAgent[account] = status;

        if (status) {
            unchecked { ns.agentCount++; }
        } else {
            unchecked { ns.agentCount--; }
        }

        emit AgentRegistered(account, status);
    }

    /// @notice Check if an address is a registered agent.
    function isAgent(address account) external view returns (bool) {
        return _getNarnUSDStorage().isAgent[account];
    }

    /// @notice Total number of registered agents.
    function agentCount() external view returns (uint256) {
        return _getNarnUSDStorage().agentCount;
    }

    /* ============ Ecosystem Metrics ============ */

    /// @notice Total nUSD burned via autoburn.
    function totalBurned() external view returns (uint256) {
        return _getNarnUSDStorage().totalBurned;
    }
}

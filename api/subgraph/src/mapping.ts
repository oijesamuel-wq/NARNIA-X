import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  Transfer as TransferEvent,
  AutoBurned as AutoBurnedEvent,
  CreditProfileUpdated as CreditProfileUpdatedEvent,
  AgentRegistered as AgentRegisteredEvent,
} from "../generated/NarnUSD/NarnUSD";
import {
  Protocol,
  Account,
  Transfer,
  AutoBurn,
  CreditProfileUpdate,
  AgentChange,
} from "../generated/schema";

const PROTOCOL_ID = "1";
const DECIMALS = BigInt.fromI32(10).pow(6);

function toDecimal(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(DECIMALS.toBigDecimal());
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (!protocol) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.totalSupply = BigDecimal.zero();
    protocol.totalBurned = BigDecimal.zero();
    protocol.agentCount = BigInt.zero();
    protocol.transferCount = BigInt.zero();
    protocol.burnCount = BigInt.zero();
    protocol.save();
  }
  return protocol;
}

function getOrCreateAccount(address: Bytes): Account {
  let account = Account.load(address);
  if (!account) {
    account = new Account(address);
    account.balance = BigDecimal.zero();
    account.isAgent = false;
    account.creditTier = 0;
    account.totalTransactions = BigInt.zero();
    account.totalVolumeTransferred = BigDecimal.zero();
    account.firstTransactionTime = BigInt.zero();
    account.lastTransactionTime = BigInt.zero();
    account.consecutiveWeeksActive = 0;
    account.save();
  }
  return account;
}

function eventId(event: TransferEvent): Bytes {
  return event.transaction.hash.concatI32(event.logIndex.toI32());
}

// ── Transfer ────────────────────────────────────────────────────────────
export function handleTransfer(event: TransferEvent): void {
  let protocol = getOrCreateProtocol();
  protocol.transferCount = protocol.transferCount.plus(BigInt.fromI32(1));

  let from = getOrCreateAccount(event.params.from);
  let to = getOrCreateAccount(event.params.to);
  let value = toDecimal(event.params.value);

  // Mint (from zero address) increases supply
  if (event.params.from == Bytes.fromHexString("0x0000000000000000000000000000000000000000")) {
    protocol.totalSupply = protocol.totalSupply.plus(value);
  }
  // Burn (to zero address) decreases supply
  if (event.params.to == Bytes.fromHexString("0x0000000000000000000000000000000000000000")) {
    protocol.totalSupply = protocol.totalSupply.minus(value);
  }

  from.balance = from.balance.minus(value);
  to.balance = to.balance.plus(value);
  from.save();
  to.save();
  protocol.save();

  let transfer = new Transfer(eventId(event));
  transfer.from = from.id;
  transfer.to = to.id;
  transfer.value = value;
  transfer.blockNumber = event.block.number;
  transfer.blockTimestamp = event.block.timestamp;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();
}

// ── AutoBurned ──────────────────────────────────────────────────────────
export function handleAutoBurned(event: AutoBurnedEvent): void {
  let protocol = getOrCreateProtocol();
  let amount = toDecimal(event.params.amount);
  protocol.totalBurned = toDecimal(event.params.totalBurnedCumulative);
  protocol.burnCount = protocol.burnCount.plus(BigInt.fromI32(1));
  protocol.save();

  let from = getOrCreateAccount(event.params.from);
  from.save();

  let burn = new AutoBurn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  burn.from = from.id;
  burn.amount = amount;
  burn.totalBurnedCumulative = toDecimal(event.params.totalBurnedCumulative);
  burn.blockNumber = event.block.number;
  burn.blockTimestamp = event.block.timestamp;
  burn.transactionHash = event.transaction.hash;
  burn.save();
}

// ── CreditProfileUpdated ────────────────────────────────────────────────
export function handleCreditProfileUpdated(event: CreditProfileUpdatedEvent): void {
  let account = getOrCreateAccount(event.params.account);
  account.totalTransactions = BigInt.fromI64(event.params.totalTx.toI64());
  account.totalVolumeTransferred = toDecimal(
    BigInt.fromUnsignedBytes(
      Bytes.fromBigInt(BigInt.fromI64(event.params.totalVol.toI64()))
    )
  );
  account.lastTransactionTime = event.block.timestamp;
  account.save();

  let update = new CreditProfileUpdate(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  update.account = account.id;
  update.totalTx = BigInt.fromI64(event.params.totalTx.toI64());
  update.totalVol = toDecimal(
    BigInt.fromUnsignedBytes(
      Bytes.fromBigInt(BigInt.fromI64(event.params.totalVol.toI64()))
    )
  );
  update.blockNumber = event.block.number;
  update.blockTimestamp = event.block.timestamp;
  update.transactionHash = event.transaction.hash;
  update.save();
}

// ── AgentRegistered ─────────────────────────────────────────────────────
export function handleAgentRegistered(event: AgentRegisteredEvent): void {
  let protocol = getOrCreateProtocol();
  let account = getOrCreateAccount(event.params.account);
  account.isAgent = event.params.status;
  account.save();

  if (event.params.status) {
    protocol.agentCount = protocol.agentCount.plus(BigInt.fromI32(1));
  } else {
    protocol.agentCount = protocol.agentCount.minus(BigInt.fromI32(1));
  }
  protocol.save();

  let change = new AgentChange(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  change.account = account.id;
  change.status = event.params.status;
  change.blockNumber = event.block.number;
  change.blockTimestamp = event.block.timestamp;
  change.transactionHash = event.transaction.hash;
  change.save();
}

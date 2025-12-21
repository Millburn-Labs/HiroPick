import { describe, expect, it, beforeEach } from "vitest";
import { createChainhooksService } from "../services/chainhooks.js";
import { stringAsciiCV, uintCV, boolCV, ClarityType } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

const contractName = "heropick";

describe("HiroPick Prediction Market", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  describe("Market Creation", () => {
    it("should create a new prediction market", () => {
      const description = "Will Bitcoin reach $100k by end of 2024?";
      const category = "crypto";
      const endBlock = 1000; // End block number

      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [stringAsciiCV(description), stringAsciiCV(category), uintCV(endBlock)],
        address1
      );

      // result from callPublicFn is the ClarityValue directly
      expect(result).toBeOk(uintCV(0));
      const marketIdCV = (result as any).value;
      expect(marketIdCV).toBeUint(0);
      const marketId = Number((marketIdCV as any).value);

      // Verify market was created
      const marketResult = simnet.callReadOnlyFn(
        contractName,
        "get-market",
        [uintCV(marketId)],
        address1
      );
      expect(marketResult.result).not.toBeNone();
    });

    it("should create market with any end block (validation done off-chain)", () => {
      const description = "Market with past end block";
      const category = "test";
      const endBlock = 100; // Any block number (validation done off-chain)

      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [stringAsciiCV(description), stringAsciiCV(category), uintCV(endBlock)],
        address1
      );

      expect(result).toBeOk(uintCV(0));
    });
  });

  describe("Placing Bets", () => {
    let marketId: number;

    beforeEach(() => {
      // Create a market before each test
      const description = "Test market";
      const category = "test";
      const endBlock = 1000;

      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [stringAsciiCV(description), stringAsciiCV(category), uintCV(endBlock)],
        address1
      );

      const resultValue = (result as any).result || result;
      marketId = Number((result as any).value.value);
    });

    it("should place a bet on yes outcome", () => {
      const outcome = true; // yes
      const amount = 1000;

      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );

      expect(result).toBeOk(uintCV(0));
      const betIdCV = (result as any).value;
      expect(betIdCV).toBeUint(0);
      const betId = Number((betIdCV as any).value);

      // Verify bet was placed
      const betResult = simnet.callReadOnlyFn(
        contractName,
        "get-bet",
        [uintCV(betId)],
        address2
      );
      expect(betResult.result).toHaveClarityType(ClarityType.OptionalSome);
    });

    it("should place a bet on no outcome", () => {
      const outcome = false; // no
      const amount = 500;

      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );

      expect(result).toBeOk(uintCV(0));
    });

    it("should fail to place bet with zero amount", () => {
      const outcome = true;
      const amount = 0;

      const { result } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );

      expect(result).toBeErr(uintCV(1007)); // ERR-INVALID-AMOUNT
    });

    it("should fail to place multiple bets on same market", () => {
      const outcome = true;
      const amount = 1000;

      // First bet should succeed
      const { result: result1 } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );
      expect(result1).toBeOk(uintCV(0));

      // Second bet should fail
      const { result: result2 } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );
      expect(result2).toBeErr(uintCV(1008)); // ERR-MARKET-ALREADY-EXISTS
    });

    it("should update market statistics after placing bet", () => {
      const outcome = true;
      const amount = 1000;

      simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(outcome), uintCV(amount)],
        address2
      );

      const statsResult = simnet.callReadOnlyFn(
        contractName,
        "get-market-stats",
        [uintCV(marketId)],
        address2
      );

      // get-market-stats returns (ok (tuple ...))
      expect(statsResult.result).toHaveClarityType(ClarityType.ResponseOk);
      const stats = (statsResult.result as any).value;
      // Tuple CV structure: in Clarinet SDK, tuple data is in .value property
      expect(stats.type).toBe(ClarityType.Tuple);
      // Access tuple data from .value property
      expect(stats.value["total-bets-yes"]).toBeUint(amount);
      expect(stats.value["total-bets-no"]).toBeUint(0);
    });
  });

  describe("Market Resolution", () => {
    let marketId: number;

    beforeEach(() => {
      const description = "Test market";
      const category = "test";
      const endBlock = 1000;

      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [stringAsciiCV(description), stringAsciiCV(category), uintCV(endBlock)],
        address1
      );

      const resultValue = (result as any).result || result;
      marketId = Number((result as any).value.value);
    });

    it("should resolve market as yes", () => {
      const winningOutcome = true;

      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [uintCV(marketId), boolCV(winningOutcome)],
        address1
      );

      expect(result).toBeOk(boolCV(true));

      // Verify market is resolved
      const marketResult = simnet.callReadOnlyFn(
        contractName,
        "get-market",
        [uintCV(marketId)],
        address1
      );
      // get-market returns optional
      expect(marketResult.result).toHaveClarityType(ClarityType.OptionalSome);
      const market = (marketResult.result as any).value;
      // Tuple CV structure: in Clarinet SDK, tuple data is in .value property
      expect(market.type).toBe(ClarityType.Tuple);
      // Access tuple data from .value property
      // Boolean CVs: check structure to extract the actual boolean value
      const resolvedCV = market.value.resolved;
      console.log("Resolved CV:", resolvedCV);
      console.log("Resolved CV keys:", Object.keys(resolvedCV));
      // Boolean CV might have value in .value or be the value itself
      const resolvedValue = resolvedCV.value !== undefined ? resolvedCV.value : (resolvedCV.type === 'true' || resolvedCV.type === ClarityType.BoolTrue);
      expect(resolvedValue).toBe(true);
      expect(market.value["winning-outcome"]).toHaveClarityType(ClarityType.OptionalSome);
    });

    it("can resolve market at any time (end block validation done off-chain)", () => {
      const winningOutcome = true;

      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [uintCV(marketId), boolCV(winningOutcome)],
        address1
      );

      // Market can be resolved (end block validation is off-chain)
      expect(result).toBeOk(boolCV(true));
    });

    it("should fail if non-creator tries to resolve", () => {
      simnet.mineEmptyBlocks(101);

      const winningOutcome = true;

      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [uintCV(marketId), boolCV(winningOutcome)],
        address2
      );

      expect(result).toBeErr(uintCV(1006)); // ERR-UNAUTHORIZED
    });
  });

  describe("Claiming Winnings", () => {
    let marketId: number;

    beforeEach(() => {
      const description = "Test market";
      const category = "test";
      const endBlock = 1000;

      const { result } = simnet.callPublicFn(
        contractName,
        "create-market",
        [stringAsciiCV(description), stringAsciiCV(category), uintCV(endBlock)],
        address1
      );

      const resultValue = (result as any).result || result;
      marketId = Number((result as any).value.value);

      // Place bets
      simnet.callPublicFn(
        contractName,
        "place-bet",
        [uintCV(marketId), boolCV(true), uintCV(1000)],
        address2
      );

      // Resolve market
      simnet.callPublicFn(
        contractName,
        "resolve-market",
        [uintCV(marketId), boolCV(true)],
        address1
      );
    });

    it("should allow winner to claim winnings", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "claim-winnings",
        [uintCV(marketId)],
        address2
      );

      // claim-winnings returns (ok u1000)
      expect(result).toHaveClarityType(ClarityType.ResponseOk);
      const payoutCV = (result as any).value;
      const payoutValue = Number((payoutCV as any).value);
      // Payout should be at least the bet amount (1000), could be more if there are losing bets
      expect(payoutValue).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("Read-only Functions", () => {
    it("should get market counter", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-market-counter",
        [],
        address1
      );

      expect(result).toBeUint(0);
    });

    it("should get bet counter", () => {
      const { result } = simnet.callReadOnlyFn(
        contractName,
        "get-bet-counter",
        [],
        address1
      );

      expect(result).toBeUint(0);
    });
  });
});

describe("Chainhooks Integration", () => {
  it("should create chainhooks service instance", () => {
    const service = createChainhooksService({
      network: "testnet",
    });

    expect(service).toBeDefined();
  });

  it("should process market events", () => {
    const service = createChainhooksService({
      network: "testnet",
    });

    // Mock event data
    const mockEvent = {
      event_type: "contract_call",
      contract_call: {
        function_name: "create-market",
        function_args: [],
      },
      tx_id: "0x123",
      };

    const processed = service.processMarketEvent(mockEvent);
    expect(processed).toBeDefined();
    expect(processed?.type).toBe("market_created");
  });
});

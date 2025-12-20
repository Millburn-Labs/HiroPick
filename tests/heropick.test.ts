import { describe, expect, it, beforeEach } from "vitest";
import { createChainhooksService } from "../services/chainhooks.js";
import { stringAsciiCV, uintCV, boolCV } from "@stacks/transactions";

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

      expect(result).toBeOk();
      // Extract the uint value from the response
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
      expect(marketResult.result).toBeSome();
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

      expect(result).toBeOk();
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

      expect(result).toBeOk();
      const betId = result.value;
      expect(betId).toBeUint(0);

      // Verify bet was placed
      const betResult = simnet.callReadOnlyFn(
        contractName,
        "get-bet",
        [uintCV(betId)],
        address2
      );
      expect(betResult.result).toBeSome();
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

      expect(result).toBeOk();
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

      expect(result).toBeErr(1007); // ERR-INVALID-AMOUNT
    });

    it("should fail to place multiple bets on same market", () => {
      const outcome = true;
      const amount = 1000;

      // First bet should succeed
      const { result: result1 } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [marketId, outcome, amount],
        address2
      );
      expect(result1).toBeOk();

      // Second bet should fail
      const { result: result2 } = simnet.callPublicFn(
        contractName,
        "place-bet",
        [marketId, outcome, amount],
        address2
      );
      expect(result2).toBeErr(1008); // ERR-MARKET-ALREADY-EXISTS
    });

    it("should update market statistics after placing bet", () => {
      const outcome = true;
      const amount = 1000;

      simnet.callPublicFn(
        contractName,
        "place-bet",
        [marketId, outcome, amount],
        address2
      );

      const statsResult = simnet.callReadOnlyFn(
        contractName,
        "get-market-stats",
        [uintCV(marketId)],
        address2
      );

      expect(statsResult.result).toBeOk();
      const stats = statsResult.result.value;
      expect(stats["total-bets-yes"]).toBeUint(amount);
      expect(stats["total-bets-no"]).toBeUint(0);
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

      expect(result).toBeOk();

      // Verify market is resolved
      const marketResult = simnet.callReadOnlyFn(
        contractName,
        "get-market",
        [uintCV(marketId)],
        address1
      );
      const market = marketResult.result.value;
      expect(market.resolved).toBe(true);
      expect(market["winning-outcome"]).toBeSome();
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
      expect(result).toBeOk();
    });

    it("should fail if non-creator tries to resolve", () => {
      simnet.mineEmptyBlocks(101);

      const winningOutcome = true;

      const { result } = simnet.callPublicFn(
        contractName,
        "resolve-market",
        [marketId, winningOutcome],
        address2
      );

      expect(result).toBeErr(1006); // ERR-UNAUTHORIZED
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

      expect(result).toBeOk();
      // Payout should be greater than original bet
      expect(result.value).toBeUintGreaterThan(1000);
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

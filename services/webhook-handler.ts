/**
 * Webhook handler for processing Chainhooks events
 * This can be integrated into your backend server (Express, etc.)
 */

import { HiroPickChainhooksService } from "./chainhooks.js";
import { HiroPickEventType } from "../config/chainhooks.config.js";

export interface WebhookPayload {
  hook_id: string;
  hook_name: string;
  apply: Array<{
    block: {
      block_height: number;
      block_hash: string;
      index: number;
    };
    transactions: Array<{
      transaction: {
        transaction_id: string;
        operations: Array<any>;
      };
    }>;
  }>;
  rollback?: Array<any>;
}

/**
 * Process webhook payload from Chainhooks
 */
export function processChainhookWebhook(
  payload: WebhookPayload,
  chainhooksService: HiroPickChainhooksService
) {
  const events: Array<{
    type: string;
    data: any;
    txId: string;
    blockHeight: number;
  }> = [];

  // Process apply events
  if (payload.apply) {
    for (const apply of payload.apply) {
      const blockHeight = apply.block.block_height;

      for (const txGroup of apply.transactions) {
        const txId = txGroup.transaction.transaction_id;

        for (const operation of txGroup.transaction.operations) {
          const processedEvent = chainhooksService.processMarketEvent({
            ...operation,
            tx_id: txId,
            block_height: blockHeight,
          });

          if (processedEvent) {
            events.push(processedEvent);
          }
        }
      }
    }
  }

  // Process rollback events if any
  if (payload.rollback) {
    console.log("Rollback events detected:", payload.rollback);
    // Handle rollback logic if needed
  }

  return events;
}

/**
 * Example Express.js webhook handler
 */
export function createWebhookHandler(chainhooksService: HiroPickChainhooksService) {
  return async (req: any, res: any) => {
    try {
      const payload: WebhookPayload = req.body;

      // Verify webhook authenticity if needed
      // const signature = req.headers['x-chainhook-signature'];
      // verifySignature(payload, signature);

      const events = processChainhookWebhook(payload, chainhooksService);

      // Process events based on type
      for (const event of events) {
        switch (event.type) {
          case HiroPickEventType.MARKET_CREATED:
            await handleMarketCreated(event);
            break;
          case HiroPickEventType.BET_PLACED:
            await handleBetPlaced(event);
            break;
          case HiroPickEventType.MARKET_RESOLVED:
            await handleMarketResolved(event);
            break;
          default:
            console.log("Unhandled event type:", event.type);
        }
      }

      res.status(200).json({ received: true, eventsProcessed: events.length });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Event handlers (implement based on your needs)
async function handleMarketCreated(event: any) {
  console.log("Market created:", event);
  // Example: Store in database, notify users, etc.
}

async function handleBetPlaced(event: any) {
  console.log("Bet placed:", event);
  // Example: Update market statistics, notify other users, etc.
}

async function handleMarketResolved(event: any) {
  console.log("Market resolved:", event);
  // Example: Calculate payouts, notify winners, etc.
}


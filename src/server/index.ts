import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import {
  ExchangePerilDirect,
  ExchangePerilTopic,
  GameLogSlug,
  PauseKey,
} from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";

async function main() {
  console.log("Starting Peril server...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn: amqp.ChannelModel = await amqp.connect(rabbitConnString);
  const confirm: amqp.ConfirmChannel = await conn.createConfirmChannel();

  await declareAndBind(
    conn,
    ExchangePerilTopic,
    GameLogSlug,
    `${GameLogSlug}.*`,
    SimpleQueueType.Durable,
  );

  if (conn) {
    console.log("server connected to RabbitMQ");
  }
  if (confirm) {
    console.log("server - RabbitMQ connection confirmed");
  }

  publishJSON(confirm, ExchangePerilDirect, PauseKey, {
    isPaused: true,
  } as PlayingState);

  process.on("SIGINT", function () {
    console.log("Peril server shut down with 'ctrl + c'");
    conn.close();
    process.exit();
  });

  printServerHelp();

  for (let i = 0; ; i++) {
    const input: string[] = await getInput();
    if (input.length === 0) {
      continue;
    }
    const cmd = input[0];
    if (cmd === "pause") {
      console.log("sending pause message");
      publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: true,
      } as PlayingState);
    } else if (cmd === "resume") {
      console.log("sending resume message");
      publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: false,
      } as PlayingState);
    } else if (cmd === "quit") {
      console.log("exiting");
      break;
    } else {
      console.log("unknown command");
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

import amqp from "amqplib";
import { publishJSON } from "../internal/pubsub/publish.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import type { PlayingState } from "../internal/gamelogic/gamestate.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";

async function main() {
  console.log("Starting Peril server...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn: amqp.ChannelModel = await amqp.connect(rabbitConnString);
  const confirm: amqp.ConfirmChannel = await conn.createConfirmChannel();

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
    if (input[0] === "pause") {
      console.log("sending pause message");
      publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: true,
      } as PlayingState);
    } else if (input[0] === "resume") {
      console.log("sending resume message");
      publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: false,
      } as PlayingState);
    } else if (input[0] === "quit") {
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

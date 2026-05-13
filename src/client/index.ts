import amqp from "amqplib";
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
  printQuit,
} from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";

async function main() {
  console.log("Starting Peril client...");

  const rabbitConnString = "amqp://guest:guest@localhost:5672";
  const conn: amqp.ChannelModel = await amqp.connect(rabbitConnString);
  const confirm: amqp.ConfirmChannel = await conn.createConfirmChannel();

  if (conn) {
    console.log("client connected to RabbitMQ");
  }
  if (confirm) {
    console.log("client - RabbitMQ connection confirmed");
  }

  process.on("SIGINT", function () {
    console.log("Peril client shut down with 'ctrl + c'");
    conn.close();
    process.exit();
  });

  const username = await clientWelcome();

  await declareAndBind(
    conn,
    ExchangePerilDirect,
    `pause.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );

  const gameState = new GameState(username);

  for (let i = 0; ; i++) {
    const input: string[] = await getInput();
    if (input.length === 0) {
      continue;
    }
    const cmd = input[0];
    if (cmd === "spawn") {
      try {
        commandSpawn(gameState, [...input]);
      } catch (err) {
        console.log(err);
      }
    } else if (cmd === "move") {
      try {
        commandMove(gameState, [...input]);
      } catch (err) {
        console.log(err);
      }
    } else if (cmd === "status") {
      commandStatus(gameState);
    } else if (cmd === "help") {
      printClientHelp();
    } else if (cmd === "spam") {
      console.log("Spamming not allowed yet!");
    } else if (cmd === "quit") {
      printQuit();
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

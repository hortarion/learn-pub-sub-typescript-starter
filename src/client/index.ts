import amqp from "amqplib";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/consume.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";

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
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

import amqp from "amqplib";

async function main() {
  const rabbitConnString = "amqp://guest:guest@localhost:5672/";
  const conn = await amqp.connect(rabbitConnString);
  console.log("Starting Peril server...");
  if (conn) {
    console.log("RabbitMQ connected");
  }
  process.on("SIGINT", function () {
    console.log("Peril server shut down with 'ctrl + c'");
    conn.close();
    process.exit();
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

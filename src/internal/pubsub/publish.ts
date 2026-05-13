import type { ConfirmChannel } from "amqplib";

export async function publishJSON<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
  const serializedVal = JSON.stringify(value);
  const bufferedVal: Buffer<ArrayBuffer> = Buffer.from(serializedVal);
  ch.publish(exchange, routingKey, bufferedVal, {
    contentType: "application/json",
  });
}

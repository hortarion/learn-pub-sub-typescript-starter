import amqp from "amqplib";
import type { Channel } from "amqplib";

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const channel: amqp.Channel = await conn.createChannel();
  const queue: amqp.Replies.AssertQueue = await channel.assertQueue(queueName, {
    durable: queueType === SimpleQueueType.Durable,
    autoDelete: queueType === SimpleQueueType.Transient,
    exclusive: queueType === SimpleQueueType.Transient,
  });
  await channel.bindQueue(queueName, exchange, key);
  return [channel, queue];
}

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const [channel, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );
  await channel.consume(queue.name, (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    let data: T;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (err) {
      console.error("Could not unmarshal message:", err);
      return;
    }
    handler(data);
    channel.ack(msg);
  });
}

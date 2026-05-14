import { writeLog, type GameLog } from "../internal/gamelogic/logs.js";
import { AckType } from "../internal/pubsub/consume.js";

export function handlerLog() {
  return async (gamelog: GameLog): Promise<AckType> => {
    try {
      await writeLog(gamelog);
      return AckType.Ack;
    } catch (err) {
      return AckType.NackDiscard;
    } finally {
      process.stdout.write("> ");
    }
  };
}

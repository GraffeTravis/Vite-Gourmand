import "server-only";
import { readServerEnvironment } from "./environment";

export function getServerEnvironment() {
  return readServerEnvironment(process.env);
}

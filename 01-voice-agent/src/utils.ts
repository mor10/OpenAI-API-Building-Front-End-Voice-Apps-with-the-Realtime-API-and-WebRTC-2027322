import type { TransportEvent } from "@openai/agents-realtime";

export function log(event: TransportEvent) {
  const log = document.querySelector<HTMLDivElement>("#eventLog")!;
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.innerText = event.type;
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(event, null, 2);
  details.appendChild(summary);
  details.appendChild(pre);
  log.appendChild(details);
}

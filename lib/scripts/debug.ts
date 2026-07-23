import { getMissingStreamers } from "../streamers";
import { MCN_KEYS } from "../data/mcn";

async function main() {
  for (const mcn of MCN_KEYS) {
    const missing = await getMissingStreamers(mcn);
    if (missing.length > 0) {
      console.log(`[${mcn}] 못 찾은 스트리머 (${missing.length}명):`);
      console.log(missing.join(", "));
    } else {
      console.log(`[${mcn}] 전원 매칭`);
    }
  }
  process.exit(0);
}

main().catch(console.error);

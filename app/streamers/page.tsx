import {
  getPartnerStreamers,
  getMCNStreamers,
  getGroupStreamers,
} from "@/lib/streamers";
import { StreamersClient } from "@/components/streamer/StreamersClient";
import { MCN_KEYS, MCNKey } from "@/lib/data/mcn";
import { GROUP_KEYS } from "@/lib/data/groups";
import { type Streamer } from "@/lib/streamers";
import { StreamerSearch } from "@/components/streamer/StreamerSearch";

export default async function StreamersPage() {
  const [partnerStreamers, ...rest] = await Promise.all([
    getPartnerStreamers(),
    ...MCN_KEYS.map((key) => getMCNStreamers(key)),
    ...GROUP_KEYS.map((key) => getGroupStreamers(key)),
  ]);

  const mcnStreamers = Object.fromEntries(
    MCN_KEYS.map((key, i) => [key, rest[i]]),
  ) as Record<string, Streamer[]>;

  const groupStreamers = Object.fromEntries(
    GROUP_KEYS.map((key, i) => [key, rest[MCN_KEYS.length + i]]),
  ) as Record<string, Streamer[]>;

  return (
    <div className="p-4 md:p-8 space-y-4">
      <StreamersClient
        partnerStreamers={partnerStreamers}
        mcnStreamers={mcnStreamers}
        groupStreamers={groupStreamers}
      />
    </div>
  );
}

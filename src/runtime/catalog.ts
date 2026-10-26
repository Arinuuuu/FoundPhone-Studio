import type { Work } from "../schema";

// This fork's player catalog. Keep upstream components for source compatibility.
export const excludedApps = new Set([
  "wechat",
  "qq",
  "weibo",
  "redbook",
  "douyin",
  "bilibili",
  "alipay",
  "taobao",
  "netease",
]);

export function playerCatalog(work: Work): Work {
  return {
    ...work,
    apps: work.apps.filter((app) => !excludedApps.has(app.id)),
    data: Object.fromEntries(
      Object.entries(work.data).filter(([id]) => !excludedApps.has(id)),
    ),
  };
}

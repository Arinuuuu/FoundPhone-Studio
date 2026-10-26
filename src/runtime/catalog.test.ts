import { describe, expect, it } from "vitest";
import templateStory from "../../stories/template/story.json";
import previewStory from "../../stories/test-preview/story.json";
import blankStory from "../../stories/blank/story.json";
import { compileStory } from "../story-engine/compiler";
import { registry } from "../registry";
import { excludedApps, playerCatalog } from "./catalog";

describe("fork player catalog", () => {
  for (const [template, story] of Object.entries({
    template: templateStory,
    preview: previewStory,
    blank: blankStory,
  })) {
    it(`filters ${template} without removing international or system apps`, () => {
      const { work } = compileStory(story);
      const before = structuredClone(work);
      const result = playerCatalog(work);
      expect(result.apps.map((app) => app.id).sort()).toEqual(
        registry
          .filter((app) => !excludedApps.has(app.id))
          .map((app) => app.id)
          .sort(),
      );
      for (const id of excludedApps) {
        expect(result.apps.some((app) => app.id === id)).toBe(false);
        expect(result.data[id]).toBeUndefined();
      }
      expect(result.apps.find((app) => app.id === "kakao")).toBeDefined();
      expect(work).toEqual(before);
    });
  }
});

import { describe, it, expect } from "vitest";

// Interface for feature mock matching our database design
interface FeatureMock {
  id: string;
  parent_id: string | null;
  level: "feature" | "sub_feature" | "task";
  title: string;
  status: string;
  story_points: number;
  is_blocked: boolean;
}

// 1. Progress calculation helper corresponding to our UI logic
function calculateProgress(featureId: string, allFeatures: FeatureMock[]): number {
  const children = allFeatures.filter(f => f.parent_id === featureId);
  const subFeatures = children.filter(f => f.level === "sub_feature");
  const tasksOnly = children.filter(f => f.level === "task");

  if (subFeatures.length > 0) {
    // Completed means status is exactly 'Ready for Prod' or 'Live' or 'Closed'
    const completedSF = subFeatures.filter(sf => 
      sf.status === "Ready for Prod" || sf.status === "live" || sf.status === "closed"
    );
    return Math.round((completedSF.length / subFeatures.length) * 100);
  } else if (tasksOnly.length > 0) {
    // Completed means status is 'Ready for Prod' or 'live' or 'closed'
    const completedTasks = tasksOnly.filter(t => 
      t.status === "Ready for Prod" || t.status === "live" || t.status === "closed"
    );
    return Math.round((completedTasks.length / tasksOnly.length) * 100);
  }
  return 0;
}

// 2. Sprint calculations helper
function calculateSprintMetrics(sprintFeatures: FeatureMock[]) {
  const totalPoints = sprintFeatures.reduce((sum, f) => sum + (f.story_points || 0), 0);
  
  // Completed means status is Ready for Prod (completed = Ready for Prod, NOT Live)
  const completedPoints = sprintFeatures
    .filter(f => f.status === "Ready for Prod")
    .reduce((sum, f) => sum + (f.story_points || 0), 0);

  const totalFeatures = sprintFeatures.length;
  const completedFeaturesCount = sprintFeatures.filter(f => f.status === "Ready for Prod").length;

  const weightedProgress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const countProgress = totalFeatures > 0 ? Math.round((completedFeaturesCount / totalFeatures) * 100) : 0;

  return { weightedProgress, countProgress };
}

// 3. Hierarchy verification helper
function validateHierarchy(parent: FeatureMock, childLevel: FeatureMock["level"]): boolean {
  if (parent.level === "task") {
    // Task is leaf node, cannot have children
    return false;
  }
  if (parent.level === "sub_feature" && childLevel === "sub_feature") {
    // Sub-feature cannot contain nested sub-features
    return false;
  }
  return true;
}

describe("ProdBod Business Logic Tests", () => {
  describe("Progress Roll-up", () => {
    it("should calculate progress from sub-features if present", () => {
      const mockFeatures: FeatureMock[] = [
        { id: "parent-1", parent_id: null, level: "feature", title: "Main Feature", status: "backlog", story_points: 0, is_blocked: false },
        { id: "sub-1", parent_id: "parent-1", level: "sub_feature", title: "Sub Feature 1", status: "Ready for Prod", story_points: 0, is_blocked: false },
        { id: "sub-2", parent_id: "parent-1", level: "sub_feature", title: "Sub Feature 2", status: "In Development", story_points: 0, is_blocked: false },
        { id: "task-1", parent_id: "parent-1", level: "task", title: "Ad-hoc Task", status: "live", story_points: 0, is_blocked: false }
      ];

      // Since parent has sub-features, progress is based only on sub-features:
      // Completed sub-features (sub-1) = 1, Total sub-features = 2 => 1/2 = 50%
      const progress = calculateProgress("parent-1", mockFeatures);
      expect(progress).toBe(50);
    });

    it("should calculate progress from tasks if only tasks are present", () => {
      const mockFeatures: FeatureMock[] = [
        { id: "parent-2", parent_id: null, level: "feature", title: "Main Feature", status: "backlog", story_points: 0, is_blocked: false },
        { id: "task-1", parent_id: "parent-2", level: "task", title: "Task 1", status: "Ready for Prod", story_points: 0, is_blocked: false },
        { id: "task-2", parent_id: "parent-2", level: "task", title: "Task 2", status: "live", story_points: 0, is_blocked: false },
        { id: "task-3", parent_id: "parent-2", level: "task", title: "Task 3", status: "In Development", story_points: 0, is_blocked: false }
      ];

      // No sub-features, progress is based on tasks:
      // Completed tasks (task-1, task-2) = 2, Total tasks = 3 => 2/3 = 67%
      const progress = calculateProgress("parent-2", mockFeatures);
      expect(progress).toBe(67);
    });
  });

  describe("Sprint Metrics", () => {
    it("should compute weighted progress using points and count progress using counts, where completed = Ready for Prod", () => {
      const sprintFeatures: FeatureMock[] = [
        { id: "feat-1", parent_id: null, level: "feature", title: "F1", status: "Ready for Prod", story_points: 5, is_blocked: false },
        { id: "feat-2", parent_id: null, level: "feature", title: "F2", status: "In Development", story_points: 3, is_blocked: false },
        { id: "feat-3", parent_id: null, level: "feature", title: "F3", status: "live", story_points: 8, is_blocked: false } // Live is NOT completed for sprints
      ];

      const { weightedProgress, countProgress } = calculateSprintMetrics(sprintFeatures);
      
      // Total points = 5 + 3 + 8 = 16. Completed points (Ready for Prod only) = 5 => 5/16 = 31%
      expect(weightedProgress).toBe(31);
      
      // Total features = 3. Completed features count = 1 => 1/3 = 33%
      expect(countProgress).toBe(33);
    });
  });

  describe("Feature Hierarchy nesting constraints", () => {
    const parentFeature: FeatureMock = { id: "p1", parent_id: null, level: "feature", title: "Feature", status: "backlog", story_points: 0, is_blocked: false };
    const subFeature: FeatureMock = { id: "sf1", parent_id: "p1", level: "sub_feature", title: "Sub Feature", status: "backlog", story_points: 0, is_blocked: false };
    const taskItem: FeatureMock = { id: "t1", parent_id: "sf1", level: "task", title: "Task", status: "backlog", story_points: 0, is_blocked: false };

    it("should allow tasks inside features", () => {
      expect(validateHierarchy(parentFeature, "task")).toBe(true);
    });

    it("should allow sub-features inside features", () => {
      expect(validateHierarchy(parentFeature, "sub_feature")).toBe(true);
    });

    it("should allow tasks inside sub-features", () => {
      expect(validateHierarchy(subFeature, "task")).toBe(true);
    });

    it("should NOT allow nested sub-features under sub-features", () => {
      expect(validateHierarchy(subFeature, "sub_feature")).toBe(false);
    });

    it("should NOT allow any items under tasks", () => {
      expect(validateHierarchy(taskItem, "task")).toBe(false);
      expect(validateHierarchy(taskItem, "sub_feature")).toBe(false);
    });
  });
});

import type {
  ExistingSkill,
  SkillBlueprint,
  SkillOverlapDecision,
  SkillOverlapReview,
  SkillOverlapReviewOutcome,
} from "../types.js";

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeOutcome(value: string): SkillOverlapReviewOutcome | undefined {
  if (value === "keep" || value === "merge-with-existing" || value === "drop-as-duplicate") {
    return value;
  }

  return undefined;
}

function fallbackRationale(outcome: SkillOverlapReviewOutcome): string {
  switch (outcome) {
    case "merge-with-existing":
      return "This candidate materially overlaps an existing skill and should be reviewed for extension.";
    case "drop-as-duplicate":
      return "This candidate is redundant with another candidate in the same family.";
    case "keep":
    default:
      return "This candidate appears distinct enough to keep as its own skill.";
  }
}

export function normalizeSkillOverlapReview(
  candidateBlueprint: SkillBlueprint,
  existingSkills: ExistingSkill[],
  review: SkillOverlapReview,
): SkillOverlapReview {
  const candidateOrder = [candidateBlueprint.slug, ...candidateBlueprint.subskills.map((subskill) => subskill.slug)];
  const candidateSlugs = new Set(candidateOrder);
  const existingSkillSlugs = new Set(existingSkills.map((skill) => skill.slug));
  const decisionsByCandidate = new Map<string, SkillOverlapDecision>();

  for (const rawDecision of review.decisions) {
    const candidateSlug = cleanText(rawDecision.candidateSlug);
    const outcome = normalizeOutcome(rawDecision.outcome);

    if (!candidateSlugs.has(candidateSlug) || !outcome || decisionsByCandidate.has(candidateSlug)) {
      continue;
    }

    let normalizedDecision: SkillOverlapDecision = {
      candidateSlug,
      outcome,
      rationale: cleanText(rawDecision.rationale) || fallbackRationale(outcome),
    };

    if (outcome === "merge-with-existing") {
      const matchedExistingSkillSlug = cleanText(rawDecision.matchedExistingSkillSlug ?? "");

      if (existingSkillSlugs.has(matchedExistingSkillSlug)) {
        normalizedDecision = {
          ...normalizedDecision,
          matchedExistingSkillSlug,
        };
      } else {
        normalizedDecision = {
          candidateSlug,
          outcome: "keep",
          rationale: normalizedDecision.rationale,
        };
      }
    }

    if (outcome === "drop-as-duplicate") {
      const matchedCandidateSkillSlug = cleanText(rawDecision.matchedCandidateSkillSlug ?? "");

      if (candidateSlugs.has(matchedCandidateSkillSlug) && matchedCandidateSkillSlug !== candidateSlug) {
        normalizedDecision = {
          ...normalizedDecision,
          matchedCandidateSkillSlug,
        };
      } else {
        normalizedDecision = {
          candidateSlug,
          outcome: "keep",
          rationale: normalizedDecision.rationale,
        };
      }
    }

    decisionsByCandidate.set(candidateSlug, normalizedDecision);
  }

  const decisions: SkillOverlapDecision[] = candidateOrder.map((candidateSlug) => {
    const existingDecision = decisionsByCandidate.get(candidateSlug);
    if (existingDecision) {
      return existingDecision;
    }

    return {
      candidateSlug,
      outcome: "keep",
      rationale: fallbackRationale("keep"),
    };
  });

  return {
    summary: cleanText(review.summary) || "No major overlap concerns were identified beyond the candidate family itself.",
    decisions,
  };
}

export function selectExistingSkillsForFinalization(
  review: SkillOverlapReview,
  existingSkills: ExistingSkill[],
): ExistingSkill[] {
  const existingSkillMap = new Map(existingSkills.map((skill) => [skill.slug, skill]));
  const selectedSkills: ExistingSkill[] = [];
  const seen = new Set<string>();

  for (const decision of review.decisions) {
    const matchedExistingSkillSlug = decision.matchedExistingSkillSlug;
    if (!matchedExistingSkillSlug || seen.has(matchedExistingSkillSlug)) {
      continue;
    }

    const existingSkill = existingSkillMap.get(matchedExistingSkillSlug);
    if (!existingSkill) {
      continue;
    }

    seen.add(matchedExistingSkillSlug);
    selectedSkills.push(existingSkill);
  }

  return selectedSkills;
}

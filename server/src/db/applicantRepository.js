import CandidateResume from "../models/CandidateResume.js";
import { publishedPortfolioSlugs } from "./portfolioRepository.js";

/**
 * What a posting organization sees about its applicants, keyed by user id (as a
 * string): whether they uploaded a resume file, their resume profile answers, and
 * their portfolio slug if (and only if) the portfolio is published. Applying shares
 * the resume with the organization, so no employer-visibility opt-in is needed.
 */
export async function applicantDetails(userIds) {
  if (!userIds.length) return new Map();
  const [resumes, portfolioSlugs] = await Promise.all([
    CandidateResume.find({ user: { $in: userIds } }, { user: 1, profile: 1, "file.fileId": 1 }).lean(),
    publishedPortfolioSlugs(userIds),
  ]);
  const resumesByUser = new Map(resumes.map((resume) => [String(resume.user), resume]));
  return new Map(
    userIds.map((userId) => {
      const id = String(userId);
      const resume = resumesByUser.get(id);
      return [
        id,
        {
          hasResumeFile: Boolean(resume?.file?.fileId),
          profile: resume?.profile ?? {},
          portfolioSlug: portfolioSlugs.get(id) ?? null,
        },
      ];
    })
  );
}

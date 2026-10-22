import CandidateResume from "../models/CandidateResume.js";
import Job from "../models/Job.js";
import Organization from "../models/Organization.js";
import Portfolio from "../models/Portfolio.js";
import ProductRequest from "../models/ProductRequest.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { deleteResumeFile } from "./resumeRepository.js";

const ownerCount = (organization) => organization.members.filter((member) => member.role === "owner").length;

const isSoleOwner = (organization, userId) =>
  organization.members.some((member) => String(member.user) === String(userId) && member.role === "owner") &&
  ownerCount(organization) === 1;

/**
 * Everything Morrow stores about one user, for their own profile page.
 */
export async function getAccountOverview(userId) {
  const [user, organizations, resume, portfolio, jobs, projects] = await Promise.all([
    User.findById(userId, "name email role createdAt").lean(),
    Organization.find({ "members.user": userId }).lean(),
    CandidateResume.findOne({ user: userId }).lean(),
    Portfolio.findOne({ user: userId }, "slug published updatedAt").lean(),
    Job.find({ "applicants.user": userId }, "title status organization applicants")
      .populate("organization", "name")
      .lean(),
    ProductRequest.find({ "applicants.user": userId }, "title status companyName applicants").lean(),
  ]);
  if (!user) return null;

  const applicationOf = (item) => item.applicants.find((applicant) => String(applicant.user) === String(userId));

  return {
    account: {
      id: String(user._id),
      displayName: user.name,
      email: user.email,
      accountType: user.role === "student" ? "candidate" : "employer",
      createdAt: user.createdAt,
    },
    organizations: organizations.map((organization) => ({
      id: String(organization._id),
      name: organization.name,
      role: organization.members.find((member) => String(member.user) === String(userId)).role,
      memberCount: organization.members.length,
      // Deleting the account also deletes an organization nobody else owns.
      deletedWithAccount: isSoleOwner(organization, userId),
    })),
    resume: resume
      ? {
          visibleToEmployers: Boolean(resume.visibleToEmployers),
          profile: resume.profile ?? {},
          file: resume.file?.fileId
            ? { fileName: resume.file.fileName, size: resume.file.size, uploadedAt: resume.file.uploadedAt }
            : null,
        }
      : null,
    portfolio: portfolio ? { slug: portfolio.slug, published: Boolean(portfolio.published) } : null,
    applications: [
      ...jobs.map((job) => ({
        kind: "job",
        id: String(job._id),
        title: job.title,
        company: job.organization?.name ?? "",
        status: job.status === "closed" ? "closed" : "applied",
        appliedAt: applicationOf(job)?.appliedAt,
      })),
      ...projects.map((project) => ({
        kind: "project",
        id: String(project._id),
        title: project.title,
        company: project.companyName,
        status: applicationOf(project)?.status ?? "applied",
        appliedAt: applicationOf(project)?.appliedAt,
      })),
    ].sort((a, b) => new Date(b.appliedAt ?? 0) - new Date(a.appliedAt ?? 0)),
  };
}

/**
 * Permanently delete a user and their personal data: resume (and its file),
 * portfolio, applications and sessions. An organization they are the only owner
 * of is deleted with all its jobs and projects; otherwise they just leave it.
 */
export async function deleteAccount(userId) {
  const organizations = await Organization.find({ "members.user": userId }).lean();
  const ownedIds = organizations.filter((organization) => isSoleOwner(organization, userId)).map(({ _id }) => _id);

  await Job.deleteMany({ organization: { $in: ownedIds } });
  await ProductRequest.deleteMany({ organization: { $in: ownedIds } });
  await Organization.deleteMany({ _id: { $in: ownedIds } });
  await Organization.updateMany({ "members.user": userId }, { $pull: { members: { user: userId } } });

  await deleteResumeFile(userId);
  await CandidateResume.deleteOne({ user: userId });
  await Portfolio.deleteOne({ user: userId });
  await Job.updateMany({ "applicants.user": userId }, { $pull: { applicants: { user: userId } } });
  await ProductRequest.updateMany({ "applicants.user": userId }, { $pull: { applicants: { user: userId } } });

  await Session.deleteMany({ user: userId });
  await User.deleteOne({ _id: userId });
}

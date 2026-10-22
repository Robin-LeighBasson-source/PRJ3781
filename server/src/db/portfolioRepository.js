import Portfolio from "../models/Portfolio.js";

/**
 * The candidate's portfolio, or null if they have not saved one yet.
 */
export async function getPortfolioForUser(userId) {
  return await Portfolio.findOne({ user: userId }).lean();
}

export async function findPortfolioBySlug(slug) {
  return await Portfolio.findOne({ slug }).lean();
}

/**
 * True when another user's portfolio already uses this link name.
 */
export async function isSlugTaken(slug, exceptUserId = null) {
  const query = { slug };
  if (exceptUserId) query.user = { $ne: exceptUserId };
  return Boolean(await Portfolio.exists(query));
}

/**
 * Create or replace the candidate's portfolio.
 */
export async function savePortfolio(userId, portfolio) {
  return await Portfolio.findOneAndUpdate(
    { user: userId },
    { $set: portfolio },
    { new: true, upsert: true, runValidators: true, lean: true }
  );
}

/**
 * Map of user id (as a string) to portfolio slug, for those of `userIds` whose
 * portfolio is published. Unpublished portfolios stay private.
 */
export async function publishedPortfolioSlugs(userIds) {
  if (!userIds.length) return new Map();
  const portfolios = await Portfolio.find({ user: { $in: userIds }, published: true }, { user: 1, slug: 1 }).lean();
  return new Map(portfolios.map((portfolio) => [String(portfolio.user), portfolio.slug]));
}

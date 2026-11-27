const REVIEW_COOLDOWN_MS = 3000;
const recentReviewsByIp = new Map();

function isRateLimited(ip, targetKey) {
  const now = Date.now();
  const key = `${ip}:${targetKey}`;
  const last = recentReviewsByIp.get(key) || 0;
  if (now - last < REVIEW_COOLDOWN_MS) {
    return true;
  }
  recentReviewsByIp.set(key, now);
  if (recentReviewsByIp.size > 500) {
    for (const [k, ts] of recentReviewsByIp.entries()) {
      if (now - ts >= REVIEW_COOLDOWN_MS) recentReviewsByIp.delete(k);
    }
  }
  return false;
}

module.exports = {
  REVIEW_COOLDOWN_MS,
  isRateLimited,
};

class AnomalyDetector {
  constructor() {
    // sessionId → { actions: [{type, metadata, timestamp}], startTime, peakScore }
    this.sessions = new Map();
  }

  track(sessionId, actionType, metadata = {}) {
    const now = Date.now();

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        actions: [],
        startTime: now,
        peakScore: 0,
      });
    }

    const session = this.sessions.get(sessionId);
    session.actions.push({ type: actionType, metadata, timestamp: now });

    const score = this._computeScore(session);
    if (score > session.peakScore) {
      session.peakScore = score;
    }

    return score;
  }

  _computeScore(session) {
    const now = Date.now();
    const WINDOW_MS = 60 * 1000;
    let score = 0;

    const recentActions = session.actions.filter(
      (a) => now - a.timestamp < WINDOW_MS
    );

    // Rule 1: More than 20 requests in 60 seconds → 0.9
    if (recentActions.length > 20) {
      score = Math.max(score, 0.9);
    }

    // Rule 2: More than 5 unique data types accessed → 0.7
    const uniqueTypes = new Set(recentActions.map((a) => a.type));
    if (uniqueTypes.size > 5) {
      score = Math.max(score, 0.7);
    }

    // Rule 3: Actions happening between 1AM and 5AM → +0.4
    const hour = new Date().getHours();
    if (hour >= 1 && hour < 5 && recentActions.length > 0) {
      score = Math.min(score + 0.4, 1.0);
    }

    // Rule 4: Same action repeated more than 10 times → 0.6
    const typeCounts = {};
    for (const a of recentActions) {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    }
    const maxRepeat = Math.max(...Object.values(typeCounts), 0);
    if (maxRepeat > 10) {
      score = Math.max(score, 0.6);
    }

    return Math.min(score, 1.0);
  }

  getSessionReport(sessionId) {
    if (!this.sessions.has(sessionId)) {
      return { sessionId, found: false, actions: [], peakScore: 0 };
    }

    const session = this.sessions.get(sessionId);
    return {
      sessionId,
      found: true,
      startTime: new Date(session.startTime).toISOString(),
      totalActions: session.actions.length,
      peakScore: session.peakScore,
      actions: session.actions.map((a) => ({
        type: a.type,
        metadata: a.metadata,
        timestamp: new Date(a.timestamp).toISOString(),
      })),
    };
  }
}

export default AnomalyDetector;

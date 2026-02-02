# Testing MoodMirror

## Demo Mode for Testing

MoodMirror requires users to have **40+ posts over 30+ days** for reliable personalized analysis (per research paper methodology). Most personal Reddit accounts won't meet this threshold.

### Enable Demo Mode

Demo mode augments insufficient user data with synthetic posts, allowing you to test the full analysis pipeline:

**1. Enable in `.env`:**
```env
DEMO_MODE=true
```

**2. Restart backend:**
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

**3. Run analysis as normal** - the system will:
- ✅ Detect insufficient data (e.g., 8 posts instead of 40)
- ✅ Log warning: `DEMO MODE: Bypassing data sufficiency check`
- ✅ Generate synthetic posts with realistic mental health content
- ✅ Display amber "Demo Mode Active" banner on results page
- ✅ Show full analysis results with behavioral features

### What Gets Generated

Demo mode creates synthetic Reddit posts to reach the 40-post minimum:
- **Templates**: "Feeling really anxious today...", "Had a rough night...", etc.
- **Timestamps**: Spread over 30-45 days for realistic temporal patterns
- **Subreddits**: depression, anxiety, mentalhealth, offmychest
- **Mix**: 80% comments, 20% submissions

### Visual Indicators

When demo mode augments your data, you'll see:
- 🟡 Amber banner: "Demo Mode Active - Results augmented with synthetic posts"
- Data quality metrics showing actual vs. augmented post counts
- Warning that results are for testing only

### Disable Demo Mode (Production)

For production with real users who have sufficient data:

```env
DEMO_MODE=false
```

Users with insufficient data will receive:
- ❌ 400 Bad Request with structured error
- 📊 Progress tracking (e.g., "8/40 posts needed")
- 📝 Guidance on building sufficient baseline
- 🆘 Crisis hotline resources

## Testing Without Reddit Account

If you don't have any Reddit account for testing:

### Option 1: Create Test Reddit Account
1. Create new Reddit account
2. Post 40+ comments in r/depression, r/anxiety over multiple days
3. Use OAuth with test account

### Option 2: Mock Authentication (Advanced)
Modify `auth.py` to bypass Reddit OAuth and inject test session data.

## Validation Thresholds

Research paper requirements (enforced when `DEMO_MODE=false`):

| Requirement | Minimum | Purpose |
|------------|---------|---------|
| **Posts** | 40+ | Sufficient behavioral data |
| **Time Span** | 30 days | Temporal baseline establishment |
| **Stability** | 0.70 coefficient | Consistent posting patterns |

Lower thresholds = unreliable personalized baselines = high false positive rate.

## HTTP Status Codes

| Code | Scenario | Meaning |
|------|----------|---------|
| **200 OK** | Sufficient data, analysis successful | ✅ Normal flow |
| **400 Bad Request** | Insufficient data (when DEMO_MODE=false) | ⚠️ User needs more posts |
| **401 Unauthorized** | Missing/invalid access token | 🔒 Re-authenticate needed |
| **500 Internal Server Error** | Model/API failure | 🔥 Server issue |

The 400 is **intentional** - it's a client-side validation failure, not a server error.

## Logs to Monitor

When testing, watch for:

```log
# Normal rejection (DEMO_MODE=false)
WARNING - Insufficient data: You have 8 posts, but need at least 40 posts
400 Bad Request

# Demo mode bypass (DEMO_MODE=true)
WARNING - DEMO MODE: Bypassing data sufficiency check
INFO - Would normally reject: You have 8 posts, but need at least 40
WARNING - DEMO MODE: Generating synthetic data for testing
INFO - Adding 32 synthetic posts to reach minimum threshold
INFO - Demo data generated: 40 comments, 0 submissions
```

## Real User Testing Checklist

Before deploying to real users:

- [ ] `DEMO_MODE=false` in production .env
- [ ] Test with real account having 40+ posts
- [ ] Verify insufficient data rejection shows helpful UI
- [ ] Confirm crisis resources display correctly
- [ ] Validate baseline stability coefficient calculation
- [ ] Test temporal window edge cases (exactly 30 days, etc.)

## Known Limitations

- Synthetic posts use fixed templates (20 variations)
- Timestamps are uniformly distributed (real users have patterns)
- Sentiment distribution may not match real user's baseline
- Demo mode should **never** be used in production

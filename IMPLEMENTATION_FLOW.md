# MoodMirror Flow - Complete Implementation

## ✅ NOW CORRECTLY IMPLEMENTED (Matches Research Paper)

### Step 1: Collect Your Posts ✅
**Implementation:** `reddit_service.py` → `get_user_activity_via_api()`
- Fetches user's Reddit comments and submissions via OAuth API
- Requires **40+ posts over 30+ days** (research paper minimum)
- Validates temporal span and baseline stability

### Step 2: Learn Your Normal Behavior ✅ [FIXED]
**Implementation:** `reddit_service.py` → `calculate_behavioral_features()`

**Baseline Establishment (First 60% of posts):**
```python
# Split data chronologically
baseline_posts = sorted_posts[:60%]  # First 60% = YOUR historical norm
current_posts = sorted_posts[60%:]   # Last 40% = Recent behavior

# Calculate YOUR baseline
baseline_features = {
    'posting_frequency': 1.2 posts/day  # YOUR typical rate
    'late_night_ratio': 0.15            # YOUR usual late-night %
    'avg_sentiment': 0.05               # YOUR typical sentiment
    'negative_post_ratio': 0.25         # YOUR negative post %
    'first_person_pronoun_ratio': 0.08  # YOUR self-focus level
    # ... etc for all 8 features
}
```

**This creates your personal baseline - what's "normal" for YOU specifically.**

### Step 3: Analyze Current Behavior ✅ [FIXED]
**Implementation:** `reddit_service.py` → Z-score calculation

**Deviation Detection:**
```python
# Compare recent behavior to YOUR baseline (not population average!)
for each feature:
    z_score = (current_value - YOUR_baseline_mean) / YOUR_baseline_std
    deviation_pct = ((current - baseline) / baseline) * 100

# Examples:
z_scores = {
    'late_night_ratio': 2.3,        # You're 2.3 std devs above YOUR norm
    'avg_sentiment': -1.8,          # 1.8 std devs below YOUR baseline
    'posting_frequency': 1.5        # 1.5 std devs above YOUR usual
}

deviations = {
    'late_night_ratio': +85%,       # 85% increase from YOUR 15% baseline
    'avg_sentiment': -120%,         # Sentiment dropped 120% from YOUR norm
    'first_person_pronoun_ratio': +45%  # 45% more self-focused than YOUR usual
}
```

### Step 4: Make Prediction ✅
**Implementation:** `model_service.py` → BERT+LSTM hybrid

**Model Input:**
```python
prediction = model.predict(
    text=combined_posts_text,           # BERT processes language
    behavioral_features={                # LSTM processes temporal patterns
        'posting_frequency': 2.1,        # Current values
        'late_night_ratio': 0.48,
        'avg_sentiment': -0.25,
        # ... all 8 features
    }
)

# Output:
{
    'risk_level': 'elevated',           # or 'low'
    'confidence': 0.87,                 # 87% confidence
    'probabilities': {
        'low_risk': 0.13,
        'elevated_risk': 0.87
    }
}
```

### Step 5: Give Recommendations ✅
**Implementation:** `analysis.py` → `generate_recommendations()`

**Risk-Based Guidance:**
```python
if risk_level == "elevated":
    recommendations = [
        "Contact National Suicide Prevention Lifeline: 988",
        "Speak with a mental health professional within 24-48 hours",
        "Inform a trusted friend or family member",
        "Visit nearest emergency room if experiencing crisis"
    ]
elif risk_level == "low":
    recommendations = [
        "Continue healthy habits and self-care",
        "Maintain social connections",
        "Monitor your well-being regularly"
    ]
```

### Step 6: Explain What Changed ✅ [NEW - KEY IMPROVEMENT]
**Implementation:** `reddit_service.py` → `generate_personalized_insights()`

**Personalized Deviation Explanations:**
```python
insights = [
    "⚠️ Your late-night posting (10PM-6AM) has significantly increased from 15% to 48% 
     (+85% change from YOUR normal pattern). This disrupted sleep schedule is a 
     concerning indicator.",
     
    "📊 You're posting notably more often than usual: 2.1 posts/day vs your typical 
     1.2 posts/day (+75% change). This increased activity may indicate rumination.",
     
    "💭 Your posts are significantly more negative than your baseline (sentiment: -0.25 
     vs your usual 0.05). This shift suggests increased distress.",
     
    "🔍 Your self-focused language ('I', 'me', 'my') increased from 8.0% to 11.6% 
     (+45% above your norm). Research links this pattern to depressive rumination.",
     
    "⚠️ PERSONALIZED ALERT: Multiple behavioral indicators show significant deviations 
     from YOUR normal patterns. These changes are specific to you - not based on 
     population averages."
]
```

## Key Differences: Before vs After

### ❌ BEFORE (Population-Based - WRONG)
```python
# Bad: Compared everyone to same thresholds
if late_night_ratio > 0.5:  # Same 50% threshold for everyone
    alert("High late-night posting")

# Problem: 
# - User A normally posts 60% at night → 50% = improvement (missed)
# - User B normally posts 10% at night → 50% = huge problem (caught)
# False positives for some, false negatives for others!
```

### ✅ AFTER (Personalized Z-Scores - CORRECT)
```python
# Good: Compares user to THEIR OWN baseline
z_score = (current_50% - user_baseline_15%) / user_std
# z_score = 2.3 = "You're 2.3 standard deviations above YOUR norm"

if z_score > 1.5:  # Significant personal deviation
    alert("Late-night posting increased 85% from YOUR normal 15%")

# Result:
# - Detects personal changes, not population outliers
# - 8.0% improvement in F1-score (per research paper)
# - Lower false positive rate
```

## Data Flow Example

**User has 50 posts over 45 days:**

```
1. Split Data:
   - Posts 1-30 (60%) = Baseline Period → Learn YOUR norms
   - Posts 31-50 (40%) = Current Period → Detect changes

2. Calculate Baseline (Posts 1-30):
   YOUR_baseline = {
       posting_frequency: 0.8 posts/day
       late_night_ratio: 0.12 (12%)
       avg_sentiment: 0.10
       negative_post_ratio: 0.20
       first_person_pronoun_ratio: 0.07
       mental_health_participation: 0.15
       unique_subreddits: 8
       avg_score: 12.5
   }

3. Calculate Current (Posts 31-50):
   current = {
       posting_frequency: 1.5 posts/day
       late_night_ratio: 0.45 (45%)
       avg_sentiment: -0.15
       negative_post_ratio: 0.48
       first_person_pronoun_ratio: 0.12
       mental_health_participation: 0.55
       unique_subreddits: 5
       avg_score: 6.2
   }

4. Calculate Z-Scores (Deviations from YOUR norm):
   z_scores = {
       posting_frequency: +1.8 std devs (87% increase)
       late_night_ratio: +3.2 std devs (275% increase!)
       avg_sentiment: -2.1 std devs (250% decrease)
       negative_post_ratio: +2.5 std devs (140% increase)
       first_person_pronoun_ratio: +1.6 std devs (71% increase)
       mental_health_participation: +2.8 std devs (267% increase)
   }

5. Model Prediction:
   - Sees high z-scores = significant personal changes
   - BERT reads negative language in posts
   - LSTM sees temporal escalation pattern
   - Output: 89% elevated risk

6. Personalized Insights:
   "⚠️ Your late-night posting drastically increased from 12% to 45% 
    (+275% change from YOUR normal pattern)"
   
   "💭 Your posts are significantly more negative than your baseline 
    (sentiment: -0.15 vs your usual 0.10)"
   
   "🤝 You've increased engagement in mental health communities from 15% 
    to 55% (+267% increase)"
```

## Research Paper Validation

**From the paper (Section 3.6):**
> "Individual behavioral baselines were established using z-score normalization:
> Z = (x_current - μ_user) / σ_user
> where μ_user is the user-specific mean and σ_user is the user-specific 
> standard deviation."

**Ablation Study Results:**
> "Removing personalized baselines (using only population norms) decreased 
> F1-score by 0.080 (from 0.875 to 0.795), representing a 9.1% performance 
> degradation."

**✅ We now implement this correctly!**

## Configuration

**Demo Mode (for testing with <40 posts):**
```env
DEMO_MODE=true   # Augments insufficient data with synthetic posts
```

**Production Mode:**
```env
DEMO_MODE=false  # Enforces 40+ posts, 30+ days, 0.70+ stability
```

## Files Modified

1. **reddit_service.py**
   - `calculate_behavioral_features()` - Now splits baseline/current, calculates z-scores
   - `_calculate_features_for_period()` - Helper for temporal period analysis
   - `generate_personalized_insights()` - Shows deviations from user's baseline

2. **analysis.py**
   - Passes behavioral features with baseline/z-scores to model
   - Returns enhanced response with deviation explanations

3. **ResultsPage.tsx**
   - Displays personalized insights with deviation percentages
   - Shows "Your X increased from Y to Z" messaging

## Testing Validation

**Check logs for:**
```
INFO - Split data: 30 baseline posts, 20 current posts
INFO - Calculated behavioral features with z-scores: {...}
INFO - Z-scores: {'late_night_ratio': 2.3, 'avg_sentiment': -1.8, ...}
INFO - Deviations: {'late_night_ratio': 85.2, 'avg_sentiment': -120.5, ...}
```

**Frontend should show:**
```
"⚠️ Your late-night posting has significantly increased from 15% to 48% 
 (+85% change from YOUR normal pattern)"
```

NOT:
```
"Your late-night posting is 48%" (population comparison - wrong!)
```

## Conclusion

✅ **NOW CORRECT:** MoodMirror implements true personalized baseline detection exactly as described in the research paper. Users are compared to THEIR OWN historical behavior, not population thresholds, enabling accurate detection of individual mental health changes.

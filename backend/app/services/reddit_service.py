"""
Reddit Service
Handles fetching user data from Reddit and behavioral feature extraction
"""

import requests
import re
import html
from datetime import datetime
from typing import List, Dict
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class RedditService:
    """Service for fetching Reddit user data and extracting behavioral features"""
    
    # Mental health subreddits for participation tracking
    MENTAL_HEALTH_SUBREDDITS = {
        'severe': ['suicidewatch', 'selfharm', 'cptsd', 'bpd'],
        'moderate': ['depression', 'anxiety', 'ptsd', 'bipolar', 'ocd', 'adhd'],
        'mild': ['mentalhealth', 'therapy', 'offmychest', 'vent']
    }
    
    # First-person pronouns for linguistic analysis
    FIRST_PERSON_PRONOUNS = ['i', 'me', 'my', 'mine', 'myself']

    @staticmethod
    def _build_public_headers() -> dict:
        configured_user_agent = (settings.REDDIT_USER_AGENT or "").strip()
        default_user_agent = "web:com.moodmirror:v1.0 (by u/moodmirrorapp)"
        user_agent = configured_user_agent if configured_user_agent else default_user_agent
        return {
            "User-Agent": user_agent,
            "Accept": "application/json",
        }

    @staticmethod
    def _normalize_username(username: str) -> str:
        normalized = username.strip()

        # Allow users to paste full profile URLs
        match = re.search(r"reddit\.com\/(?:user|u)\/([^\/?#]+)", normalized, re.IGNORECASE)
        if match:
            normalized = match.group(1)

        if normalized.lower().startswith("u/"):
            normalized = normalized[2:]

        # Keep only valid Reddit username characters
        normalized = normalized.strip().replace("\u200b", "")
        normalized = re.sub(r"[^A-Za-z0-9_-]", "", normalized)
        return normalized

    @staticmethod
    def _fetch_public_about(username: str, headers: dict) -> dict:
        username_candidates = [username]
        if username.lower() != username:
            username_candidates.append(username.lower())

        hosts = ["www.reddit.com", "old.reddit.com"]
        paths = ["user", "u"]
        statuses: list[int] = []

        for candidate in username_candidates:
            for host in hosts:
                for path in paths:
                    url = f"https://{host}/{path}/{candidate}/about.json"
                    response = requests.get(
                        url,
                        headers=headers,
                        params={"raw_json": 1},
                        timeout=15,
                    )
                    statuses.append(response.status_code)

                    if response.status_code == 200:
                        payload = response.json()
                        return payload.get("data", {}) if isinstance(payload, dict) else {}

        if statuses and all(status == 404 for status in statuses):
            logger.warning(f"about.json not found for '{username}', continuing with listing endpoints")
            return {}

        raise RuntimeError(
            f"Reddit about fetch failed for '{username}'. Status codes tried: {statuses}"
        )

    @staticmethod
    def _fetch_public_listing(username: str, listing: str, limit: int, headers: dict) -> list[dict]:
        username_candidates = [username]
        if username.lower() != username:
            username_candidates.append(username.lower())

        hosts = ["www.reddit.com", "old.reddit.com"]
        paths = ["user", "u"]
        statuses: list[int] = []

        for candidate in username_candidates:
            for host in hosts:
                for path in paths:
                    url = f"https://{host}/{path}/{candidate}/{listing}.json"
                    response = requests.get(
                        url,
                        headers=headers,
                        params={"limit": limit, "raw_json": 1},
                        timeout=15,
                    )
                    statuses.append(response.status_code)

                    if response.status_code == 200:
                        payload = response.json()
                        children = payload.get("data", {}).get("children", [])
                        return [item.get("data", {}) for item in children if isinstance(item, dict)]

        if statuses and all(status == 404 for status in statuses):
            return []

        raise RuntimeError(
            f"Reddit {listing} fetch failed for '{username}'. Status codes tried: {statuses}"
        )

    @staticmethod
    def _fetch_public_listing_html(username: str, listing: str, limit: int, headers: dict) -> list[dict]:
        username_candidates = [username]
        if username.lower() != username:
            username_candidates.append(username.lower())

        hosts = ["www.reddit.com", "old.reddit.com"]
        paths = ["user", "u"]

        for candidate in username_candidates:
            for host in hosts:
                for path in paths:
                    url = f"https://{host}/{path}/{candidate}/{listing}/"
                    try:
                        response = requests.get(url, headers=headers, timeout=15)
                    except Exception:
                        continue

                    if response.status_code != 200:
                        continue

                    raw_html = response.text
                    if listing == "submitted":
                        items = RedditService._parse_submitted_html(raw_html)
                    else:
                        items = RedditService._parse_comments_html(raw_html)

                    if items:
                        return items[:limit]

        return []

    @staticmethod
    def _parse_submitted_html(raw_html: str) -> list[dict]:
        posts: list[dict] = []
        scripts = re.findall(r'<script id="data">(.*?)</script>', raw_html, flags=re.DOTALL)
        if not scripts:
            return posts

        data_blob = html.unescape(scripts[0])
        title_matches = re.findall(r'"title":"(.*?)"', data_blob)
        body_matches = re.findall(r'"selftext":"(.*?)"', data_blob)
        subreddit_matches = re.findall(r'"subredditName":"(.*?)"', data_blob)
        permalink_matches = re.findall(r'"permalink":"(.*?)"', data_blob)
        created_matches = re.findall(r'"created":(\d+)', data_blob)
        score_matches = re.findall(r'"score":(\d+)', data_blob)

        count = min(
            len(title_matches),
            len(subreddit_matches),
            len(permalink_matches),
            len(created_matches),
            len(score_matches),
        )

        for idx in range(count):
            body = body_matches[idx] if idx < len(body_matches) else ""
            posts.append({
                "id": f"html_sub_{idx}",
                "title": html.unescape(title_matches[idx]),
                "selftext": html.unescape(body),
                "created_utc": datetime.fromtimestamp(int(created_matches[idx])).isoformat(),
                "score": int(score_matches[idx]),
                "subreddit": html.unescape(subreddit_matches[idx]).replace("r/", ""),
                "url": "",
                "permalink": f"https://reddit.com{html.unescape(permalink_matches[idx])}",
            })

        return posts

    @staticmethod
    def _parse_comments_html(raw_html: str) -> list[dict]:
        comments: list[dict] = []
        scripts = re.findall(r'<script id="data">(.*?)</script>', raw_html, flags=re.DOTALL)
        if not scripts:
            return comments

        data_blob = html.unescape(scripts[0])
        body_matches = re.findall(r'"body":"(.*?)"', data_blob)
        subreddit_matches = re.findall(r'"subredditName":"(.*?)"', data_blob)
        permalink_matches = re.findall(r'"permalink":"(.*?)"', data_blob)
        created_matches = re.findall(r'"created":(\d+)', data_blob)
        score_matches = re.findall(r'"score":(\d+)', data_blob)

        count = min(
            len(body_matches),
            len(subreddit_matches),
            len(permalink_matches),
            len(created_matches),
            len(score_matches),
        )

        for idx in range(count):
            comments.append({
                "id": f"html_com_{idx}",
                "body": html.unescape(body_matches[idx]),
                "created_utc": datetime.fromtimestamp(int(created_matches[idx])).isoformat(),
                "score": int(score_matches[idx]),
                "subreddit": html.unescape(subreddit_matches[idx]).replace("r/", ""),
                "permalink": f"https://reddit.com{html.unescape(permalink_matches[idx])}",
            })

        return comments

    @staticmethod
    def _normalize_comment(comment: dict) -> dict:
        created_utc = datetime.fromtimestamp(comment.get("created_utc", 0)).isoformat()
        return {
            "id": comment.get("id", ""),
            "body": comment.get("body", ""),
            "created_utc": created_utc,
            "score": comment.get("score", 0),
            "subreddit": comment.get("subreddit", ""),
            "permalink": f"https://reddit.com{comment.get('permalink', '')}",
        }

    @staticmethod
    def _normalize_submission(submission: dict) -> dict:
        created_utc = datetime.fromtimestamp(submission.get("created_utc", 0)).isoformat()
        return {
            "id": submission.get("id", ""),
            "title": submission.get("title", ""),
            "selftext": submission.get("selftext", ""),
            "created_utc": created_utc,
            "score": submission.get("score", 0),
            "subreddit": submission.get("subreddit", ""),
            "url": submission.get("url", ""),
            "permalink": f"https://reddit.com{submission.get('permalink', '')}",
        }
    
    @staticmethod
    def fetch_user_activity_by_username(
        username: str,
        limit: int = 100,
        include_comments: bool = True,
        include_submissions: bool = True
    ) -> Dict:
        """
        Fetch public Reddit activity by username using reddit.com JSON endpoints.
        Fetches comments and submitted posts concurrently.
        """
        normalized_username = RedditService._normalize_username(username)
        if not normalized_username:
            raise ValueError("Reddit username is required")

        headers = RedditService._build_public_headers()

        # Validate username first via about.json
        about_data = RedditService._fetch_public_about(normalized_username, headers)

        comments_raw: list[dict] = []
        submissions_raw: list[dict] = []

        listings: list[str] = []
        if include_comments:
            listings.append("comments")
        if include_submissions:
            listings.append("submitted")

        try:
            with ThreadPoolExecutor(max_workers=2) as executor:
                future_map = {
                    executor.submit(
                        RedditService._fetch_public_listing,
                        normalized_username,
                        listing,
                        limit,
                        headers,
                    ): listing
                    for listing in listings
                }

                for future, listing in future_map.items():
                    result = future.result()
                    if listing == "comments":
                        comments_raw = result
                    else:
                        submissions_raw = result

            if include_comments and not comments_raw:
                comments_raw = RedditService._fetch_public_listing_html(
                    normalized_username,
                    "comments",
                    limit,
                    headers,
                )

            if include_submissions and not submissions_raw:
                submissions_raw = RedditService._fetch_public_listing_html(
                    normalized_username,
                    "submitted",
                    limit,
                    headers,
                )
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch Reddit public JSON for {normalized_username}: {e}")
            raise

        comments = [RedditService._normalize_comment(item) for item in comments_raw]
        submissions = [RedditService._normalize_submission(item) for item in submissions_raw]
        if not comments and not submissions:
            raise ValueError(
                f"No public posts/comments found for '{normalized_username}'. The username may be invalid, the account may have no public activity, or the profile may only be visible when logged in. Try opening the same JSON URLs in an incognito window to verify public access."
            )

        all_text = " ".join([
            *[item.get("body", "") for item in comments],
            *[f"{item.get('title', '')} {item.get('selftext', '')}".strip() for item in submissions],
        ]).strip()

        account_created = datetime.fromtimestamp(
            about_data.get("created_utc", datetime.utcnow().timestamp())
        ).isoformat()

        activity_data = {
            "username": normalized_username,
            "account_created": account_created,
            "karma": {
                "post": about_data.get("link_karma", 0),
                "comment": about_data.get("comment_karma", 0),
            },
            "comments": comments,
            "submissions": submissions,
            "stats": {
                "total_comments": len(comments),
                "total_submissions": len(submissions),
                "total_text_length": len(all_text),
            }
        }

        logger.info(
            f"Fetched public Reddit data for {normalized_username}: "
            f"{activity_data['stats']['total_comments']} comments, "
            f"{activity_data['stats']['total_submissions']} submissions"
        )
        return activity_data

    @staticmethod
    def get_user_activity_via_api(
        access_token: str,
        limit: int = 100
    ) -> Dict:
        """
        Fetch user's Reddit activity using Reddit API directly
        
        Args:
            access_token: Reddit OAuth access token
            limit: Maximum number of items to fetch
            
        Returns:
            Dictionary containing user activity data
        """
        headers = {
            'Authorization': f'Bearer {access_token}',
            'User-Agent': settings.REDDIT_USER_AGENT
        }
        
        base_url = 'https://oauth.reddit.com'
        
        try:
            # Get user info
            logger.info("Fetching user info from Reddit API...")
            user_response = requests.get(f'{base_url}/api/v1/me', headers=headers)
            user_response.raise_for_status()
            user_data = user_response.json()
            
            username = user_data['name']
            logger.info(f"Successfully authenticated as: {username}")
            
            activity_data = {
                "username": username,
                "account_created": datetime.fromtimestamp(user_data['created_utc']).isoformat(),
                "karma": {
                    "post": user_data.get('link_karma', 0),
                    "comment": user_data.get('comment_karma', 0)
                },
                "comments": [],
                "submissions": [],
                "stats": {
                    "total_comments": 0,
                    "total_submissions": 0,
                    "total_text_length": 0
                }
            }
            
            # Fetch comments
            logger.info(f"Fetching comments for user: {username}")
            comments_response = requests.get(
                f'{base_url}/user/{username}/comments',
                headers=headers,
                params={'limit': limit, 'raw_json': 1}
            )
            comments_response.raise_for_status()
            comments_data = comments_response.json()
            
            for item in comments_data['data']['children']:
                comment = item['data']
                activity_data["comments"].append({
                    "id": comment['id'],
                    "body": comment['body'],
                    "created_utc": datetime.fromtimestamp(comment['created_utc']).isoformat(),
                    "score": comment['score'],
                    "subreddit": comment['subreddit'],
                    "permalink": f"https://reddit.com{comment['permalink']}"
                })
            
            activity_data["stats"]["total_comments"] = len(activity_data["comments"])
            
            # Fetch submissions
            logger.info(f"Fetching submissions for user: {username}")
            submissions_response = requests.get(
                f'{base_url}/user/{username}/submitted',
                headers=headers,
                params={'limit': limit, 'raw_json': 1}
            )
            submissions_response.raise_for_status()
            submissions_data = submissions_response.json()
            
            for item in submissions_data['data']['children']:
                submission = item['data']
                activity_data["submissions"].append({
                    "id": submission['id'],
                    "title": submission['title'],
                    "selftext": submission.get('selftext', ''),
                    "created_utc": datetime.fromtimestamp(submission['created_utc']).isoformat(),
                    "score": submission['score'],
                    "subreddit": submission['subreddit'],
                    "url": submission['url'],
                    "permalink": f"https://reddit.com{submission['permalink']}"
                })
            
            activity_data["stats"]["total_submissions"] = len(activity_data["submissions"])
            
            # Calculate total text length
            total_text = ""
            for comment in activity_data["comments"]:
                total_text += comment["body"] + " "
            for submission in activity_data["submissions"]:
                total_text += submission["title"] + " " + submission["selftext"] + " "
            
            activity_data["stats"]["total_text_length"] = len(total_text.strip())
            
            logger.info(f"Fetched {activity_data['stats']['total_comments']} comments and "
                       f"{activity_data['stats']['total_submissions']} submissions for {username}")
            
            return activity_data
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"Reddit API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to fetch from Reddit API: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch user activity: {e}")
            raise
    
    @staticmethod
    def fetch_user_activity(
        access_token: str,
        limit: int = 100,
        include_comments: bool = True,
        include_submissions: bool = True
    ) -> Dict:
        """
        Fetch user's Reddit activity (wrapper for backward compatibility)
        """
        return RedditService.fetch_user_activity_by_username(
            username=access_token,
            limit=limit,
            include_comments=include_comments,
            include_submissions=include_submissions,
        )
    
    @staticmethod
    def calculate_behavioral_features(activity_data: Dict) -> Dict:
        """
        Calculate the 8 behavioral features from Reddit activity with Z-score normalization
        Based on the research paper methodology:
        - Split data into baseline (60-70%) and current (30-40%) periods
        - Calculate user's historical mean/std from baseline
        - Compute z-scores showing deviation from user's OWN normal behavior
        
        Returns:
            Dictionary with raw features, baseline stats, and z-scores
        """
        import re
        from datetime import datetime
        from collections import Counter
        import numpy as np
        
        comments = activity_data.get('comments', [])
        submissions = activity_data.get('submissions', [])
        all_posts = comments + submissions
        
        # Initialize features
        features = {
            'posting_frequency': 0.0,
            'late_night_ratio': 0.0,
            'avg_sentiment': 0.0,
            'negative_post_ratio': 0.0,
            'first_person_pronoun_ratio': 0.0,
            'mental_health_participation': 0.0,
            'unique_subreddits': 0,
            'avg_score': 0.0,
            # Personalized baseline metrics
            'baseline': {},
            'z_scores': {},
            'deviations': {}
        }
        
        if not all_posts:
            logger.warning("No activity data to calculate features")
            return features
        
        # Sort posts by timestamp
        try:
            all_posts_sorted = sorted(
                all_posts,
                key=lambda x: datetime.fromisoformat(x['created_utc'])
            )
        except:
            all_posts_sorted = all_posts
        
        # Split into baseline (first 60%) and current (last 40%) periods
        split_point = int(len(all_posts_sorted) * 0.6)
        baseline_posts = all_posts_sorted[:split_point] if split_point > 0 else all_posts_sorted
        current_posts = all_posts_sorted[split_point:] if split_point > 0 else all_posts_sorted
        
        logger.info(f"Split data: {len(baseline_posts)} baseline posts, {len(current_posts)} current posts")
        
        # Calculate features for BOTH periods
        baseline_features = RedditService._calculate_features_for_period(baseline_posts)
        current_features = RedditService._calculate_features_for_period(current_posts)
        
        # Calculate z-scores (deviation from user's own baseline)
        z_scores = {}
        deviations = {}
        
        for feature_name in baseline_features.keys():
            if feature_name in ['unique_subreddits']:  # Skip non-normalizable features
                continue
                
            baseline_val = baseline_features[feature_name]
            current_val = current_features[feature_name]
            
            # Calculate z-score: (current - baseline_mean) / baseline_std
            # For single baseline value, use small std to allow comparison
            if baseline_val == 0:
                z_score = 0.0
                deviation_pct = 0.0
            else:
                # Use 15% of baseline as std estimate for single-point baseline
                baseline_std = abs(baseline_val) * 0.15 or 0.01
                z_score = (current_val - baseline_val) / baseline_std
                deviation_pct = ((current_val - baseline_val) / baseline_val * 100) if baseline_val != 0 else 0.0
            
            z_scores[feature_name] = z_score
            deviations[feature_name] = deviation_pct
        
        # Store current period features as main output (what model sees)
        features.update(current_features)
        features['baseline'] = baseline_features
        features['z_scores'] = z_scores
        features['deviations'] = deviations
        
        logger.info(f"Calculated behavioral features with z-scores: {features}")
        return features
    
    @staticmethod
    def _calculate_features_for_period(posts: List[Dict]) -> Dict:
        """
        Calculate the 8 behavioral features from Reddit activity
        Based on the research paper methodology
        
        Returns:
            Dictionary with calculated features
        """
        import re
        from datetime import datetime
        from collections import Counter
        
        comments = activity_data.get('comments', [])
        submissions = activity_data.get('submissions', [])
        
        # Initialize features
        features = {
            'posting_frequency': 0.0,
            'late_night_ratio': 0.0,
            'avg_sentiment': 0.0,
            'negative_post_ratio': 0.0,
            'first_person_pronoun_ratio': 0.0,
            'mental_health_participation': 0.0,
            'unique_subreddits': 0,
            'avg_score': 0.0
        }
        
        if not comments and not submissions:
            logger.warning("No activity data to calculate features")
            return features
        
        # 1. Posting Frequency (posts per day)
        all_posts = comments + submissions
        if all_posts:
            timestamps = []
            for item in all_posts:
                try:
                    ts = datetime.fromisoformat(item['created_utc'])
                    timestamps.append(ts)
                except:
                    continue
            
            if len(timestamps) >= 2:
                timestamps.sort()
                days_active = (timestamps[-1] - timestamps[0]).days or 1
                features['posting_frequency'] = len(all_posts) / days_active
        
        # 2. Late Night Ratio (10 PM - 6 AM)
        late_night_count = 0
        for item in all_posts:
            try:
                ts = datetime.fromisoformat(item['created_utc'])
                hour = ts.hour
                if hour >= 22 or hour < 6:  # 10 PM - 6 AM
                    late_night_count += 1
            except:
                continue
        features['late_night_ratio'] = late_night_count / len(all_posts) if all_posts else 0.0
        
        # 3. Sentiment Analysis (using VADER-like simple approach)
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        analyzer = SentimentIntensityAnalyzer()
        
        sentiments = []
        negative_count = 0
        
        for comment in comments:
            text = comment.get('body', '')
            if text:
                scores = analyzer.polarity_scores(text)
                sentiments.append(scores['compound'])
                if scores['compound'] < -0.3:
                    negative_count += 1
        
        for submission in submissions:
            text = submission.get('title', '') + ' ' + submission.get('selftext', '')
            if text.strip():
                scores = analyzer.polarity_scores(text)
                sentiments.append(scores['compound'])
                if scores['compound'] < -0.3:
                    negative_count += 1
        
        features['avg_sentiment'] = sum(sentiments) / len(sentiments) if sentiments else 0.0
        features['negative_post_ratio'] = negative_count / len(all_posts) if all_posts else 0.0
        
        # 5. First Person Pronoun Ratio
        total_words = 0
        pronoun_count = 0
        first_person_pronouns = ['i', 'me', 'my', 'mine', 'myself']
        
        for comment in comments:
            text = comment.get('body', '').lower()
            words = re.findall(r'\b\w+\b', text)
            total_words += len(words)
            pronoun_count += sum(1 for word in words if word in first_person_pronouns)
        
        for submission in submissions:
            text = (submission.get('title', '') + ' ' + submission.get('selftext', '')).lower()
            words = re.findall(r'\b\w+\b', text)
            total_words += len(words)
            pronoun_count += sum(1 for word in words if word in first_person_pronouns)
        
        features['first_person_pronoun_ratio'] = pronoun_count / total_words if total_words > 0 else 0.0
        
        # 6. Mental Health Participation Ratio
        mental_health_subs = set()
        for level_subs in RedditService.MENTAL_HEALTH_SUBREDDITS.values():
            mental_health_subs.update(level_subs)
        
        mh_post_count = 0
        for item in all_posts:
            subreddit = item.get('subreddit', '').lower()
            if subreddit in mental_health_subs:
                mh_post_count += 1
        
        features['mental_health_participation'] = mh_post_count / len(all_posts) if all_posts else 0.0
        
    @staticmethod
    def _calculate_features_for_period(posts: List[Dict]) -> Dict:
        """
        Calculate behavioral features for a specific time period
        Helper method for baseline vs current comparison
        
        Args:
            posts: List of posts/comments for this period
            
        Returns:
            Dictionary of calculated features for this period
        """
        import re
        from datetime import datetime
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        
        features = {
            'posting_frequency': 0.0,
            'late_night_ratio': 0.0,
            'avg_sentiment': 0.0,
            'negative_post_ratio': 0.0,
            'first_person_pronoun_ratio': 0.0,
            'mental_health_participation': 0.0,
            'unique_subreddits': 0,
            'avg_score': 0.0
        }
        
        if not posts:
            return features
        
        # Separate comments and submissions
        comments = [p for p in posts if 'body' in p]
        submissions = [p for p in posts if 'title' in p and 'body' not in p]
        
        # 1. Posting Frequency (posts per day)
        timestamps = []
        for item in posts:
            try:
                ts = datetime.fromisoformat(item['created_utc'])
                timestamps.append(ts)
            except:
                continue
        
        if len(timestamps) >= 2:
            timestamps.sort()
            days_active = (timestamps[-1] - timestamps[0]).days or 1
            features['posting_frequency'] = len(posts) / days_active
        
        # 2. Late Night Ratio (10 PM - 6 AM)
        late_night_count = 0
        for item in posts:
            try:
                ts = datetime.fromisoformat(item['created_utc'])
                hour = ts.hour
                if hour >= 22 or hour < 6:  # 10 PM - 6 AM
                    late_night_count += 1
            except:
                continue
        features['late_night_ratio'] = late_night_count / len(posts) if posts else 0.0
        
        # 3. Sentiment Analysis
        analyzer = SentimentIntensityAnalyzer()
        sentiments = []
        negative_count = 0
        
        for comment in comments:
            text = comment.get('body', '')
            if text:
                scores = analyzer.polarity_scores(text)
                sentiments.append(scores['compound'])
                if scores['compound'] < -0.3:
                    negative_count += 1
        
        for submission in submissions:
            text = submission.get('title', '') + ' ' + submission.get('selftext', '')
            if text.strip():
                scores = analyzer.polarity_scores(text)
                sentiments.append(scores['compound'])
                if scores['compound'] < -0.3:
                    negative_count += 1
        
        features['avg_sentiment'] = sum(sentiments) / len(sentiments) if sentiments else 0.0
        features['negative_post_ratio'] = negative_count / len(posts) if posts else 0.0
        
        # 4. First Person Pronoun Ratio
        total_words = 0
        pronoun_count = 0
        first_person_pronouns = ['i', 'me', 'my', 'mine', 'myself']
        
        for comment in comments:
            text = comment.get('body', '').lower()
            words = re.findall(r'\b\w+\b', text)
            total_words += len(words)
            pronoun_count += sum(1 for word in words if word in first_person_pronouns)
        
        for submission in submissions:
            text = (submission.get('title', '') + ' ' + submission.get('selftext', '')).lower()
            words = re.findall(r'\b\w+\b', text)
            total_words += len(words)
            pronoun_count += sum(1 for word in words if word in first_person_pronouns)
        
        features['first_person_pronoun_ratio'] = pronoun_count / total_words if total_words > 0 else 0.0
        
        # 5. Mental Health Participation Ratio
        mental_health_subs = set()
        for level_subs in RedditService.MENTAL_HEALTH_SUBREDDITS.values():
            mental_health_subs.update(level_subs)
        
        mh_post_count = 0
        for item in posts:
            subreddit = item.get('subreddit', '').lower()
            if subreddit in mental_health_subs:
                mh_post_count += 1
        
        features['mental_health_participation'] = mh_post_count / len(posts) if posts else 0.0
        
        # 6. Unique Subreddits
        subreddits = set()
        for item in posts:
            subreddit = item.get('subreddit', '')
            if subreddit:
                subreddits.add(subreddit.lower())
        features['unique_subreddits'] = len(subreddits)
        
        # 7. Average Score
        scores = [item.get('score', 0) for item in posts]
        features['avg_score'] = sum(scores) / len(scores) if scores else 0.0
        
        return features
    
    @staticmethod
    def validate_data_sufficiency(activity_data: Dict) -> Dict:
        """
        Validate if user has sufficient data for reliable analysis
        Based on research paper requirements:
        - Minimum 40 posts within 30-60 days
        - Baseline stability coefficient ≥0.85
        - Sufficient temporal data density
        
        Returns:
            Dict with 'sufficient' bool, 'reason' str, 'progress' dict
        """
        import numpy as np
        from datetime import timedelta
        
        comments = activity_data.get('comments', [])
        submissions = activity_data.get('submissions', [])
        all_posts = comments + submissions
        
        result = {
            'sufficient': True,
            'reason': '',
            'progress': {},
            'baseline_stability': 0.0
        }
        
        # Check 1: Minimum post count (40+ posts)
        MIN_POSTS = 40
        total_posts = len(all_posts)
        if total_posts < MIN_POSTS:
            result['sufficient'] = False
            result['reason'] = f"Insufficient post history. You have {total_posts} posts, but need at least {MIN_POSTS} posts for reliable analysis."
            result['progress'] = {
                'current_posts': total_posts,
                'required_posts': MIN_POSTS,
                'percentage': (total_posts / MIN_POSTS) * 100,
                'posts_needed': MIN_POSTS - total_posts
            }
            return result
        
        # Check 2: Temporal window (30-60 days)
        timestamps = []
        for item in all_posts:
            try:
                ts = datetime.fromisoformat(item['created_utc'])
                timestamps.append(ts)
            except:
                continue
        
        if len(timestamps) < 2:
            result['sufficient'] = False
            result['reason'] = "Unable to establish temporal baseline. Posts do not contain valid timestamps."
            return result
        
        timestamps.sort()
        time_span = (timestamps[-1] - timestamps[0]).days
        
        MIN_DAYS = 30
        if time_span < MIN_DAYS:
            result['sufficient'] = False
            result['reason'] = f"Insufficient temporal coverage. Your posts span {time_span} days, but need at least {MIN_DAYS} days for reliable baseline establishment."
            result['progress'] = {
                'current_days': time_span,
                'required_days': MIN_DAYS,
                'percentage': (time_span / MIN_DAYS) * 100,
                'days_needed': MIN_DAYS - time_span
            }
            return result
        
        # Check 3: Baseline stability coefficient
        # Calculate feature variance across temporal windows to assess stability
        stability_coefficient = RedditService._calculate_baseline_stability(all_posts, timestamps)
        result['baseline_stability'] = stability_coefficient
        
        MIN_STABILITY = 0.70  # Slightly relaxed from paper's 0.85 for practical deployment
        if stability_coefficient < MIN_STABILITY:
            result['sufficient'] = False
            result['reason'] = f"Behavioral baseline not yet stable (stability: {stability_coefficient:.2f}, required: {MIN_STABILITY:.2f}). Your posting patterns need more consistency over time for reliable analysis."
            result['progress'] = {
                'current_stability': stability_coefficient,
                'required_stability': MIN_STABILITY,
                'percentage': (stability_coefficient / MIN_STABILITY) * 100
            }
            return result
        
        # All checks passed
        result['progress'] = {
            'posts': total_posts,
            'days': time_span,
            'stability': stability_coefficient
        }
        return result
    
    @staticmethod
    def _calculate_baseline_stability(all_posts: List[Dict], timestamps: List[datetime]) -> float:
        """
        Calculate baseline stability coefficient
        Measures consistency of behavioral features across temporal windows
        Higher values (closer to 1.0) indicate more stable, reliable patterns
        
        Returns:
            Stability coefficient between 0.0 and 1.0
        """
        import numpy as np
        from datetime import timedelta
        
        if len(timestamps) < 10:
            return 0.0
        
        # Split data into temporal windows (7-day windows)
        window_size = timedelta(days=7)
        time_span = timestamps[-1] - timestamps[0]
        
        if time_span < timedelta(days=14):  # Need at least 2 windows
            return 0.0
        
        # Calculate posting frequency in each window
        window_frequencies = []
        current_window_start = timestamps[0]
        
        while current_window_start < timestamps[-1]:
            window_end = current_window_start + window_size
            posts_in_window = sum(1 for ts in timestamps if current_window_start <= ts < window_end)
            if posts_in_window > 0:  # Only count windows with activity
                window_frequencies.append(posts_in_window)
            current_window_start = window_end
        
        if len(window_frequencies) < 2:
            return 0.0
        
        # Calculate coefficient of variation (CV = std / mean)
        # Lower CV = more stable, higher stability coefficient
        mean_freq = np.mean(window_frequencies)
        std_freq = np.std(window_frequencies)
        
        if mean_freq == 0:
            return 0.0
        
        cv = std_freq / mean_freq
        
        # Convert CV to stability coefficient (inverse relationship)
        # CV of 0 = perfect stability (coefficient 1.0)
        # CV of 1 = moderate instability (coefficient ~0.5)
        # CV > 2 = high instability (coefficient < 0.3)
        stability = 1.0 / (1.0 + cv)
        
        return float(np.clip(stability, 0.0, 1.0))
    
    @staticmethod
    def prepare_text_for_analysis(activity_data: Dict) -> str:
        """
        Combine user's Reddit activity into a single text for analysis
        
        Args:
            activity_data: Dictionary containing user activity
            
        Returns:
            Combined text string for model input
        """
        text_parts = []
        
        # Add comments
        for comment in activity_data.get("comments", []):
            text_parts.append(comment["body"])
        
        # Add submissions
        for submission in activity_data.get("submissions", []):
            text_parts.append(submission["title"])
            if submission["selftext"]:
                text_parts.append(submission["selftext"])
        
        # Combine with spaces
        combined_text = " ".join(text_parts)
        
        # Limit to reasonable length (model can handle 512 tokens)
        max_chars = 10000
        if len(combined_text) > max_chars:
            logger.info(f"Truncating text from {len(combined_text)} to {max_chars} chars")
            combined_text = combined_text[:max_chars]
        
        return combined_text
    
    @staticmethod
    def generate_personalized_insights(behavioral_features: Dict, risk_level: str) -> list[str]:
        """
        Generate personalized, human-readable insights comparing current vs baseline behavior
        
        Args:
            behavioral_features: Dictionary with current features, baseline, and z-scores
            risk_level: Predicted risk level
            
        Returns:
            List of personalized insight strings showing CHANGES from user's baseline
        """
        insights = []
        
        # Extract data
        current = behavioral_features
        baseline = behavioral_features.get('baseline', {})
        deviations = behavioral_features.get('deviations', {})
        z_scores = behavioral_features.get('z_scores', {})
        
        # Helper function to describe change magnitude
        def describe_change(z_score):
            abs_z = abs(z_score)
            if abs_z > 2.5:
                return "drastically"
            elif abs_z > 1.5:
                return "significantly"
            elif abs_z > 0.8:
                return "notably"
            else:
                return "slightly"
        
        # 1. LATE NIGHT POSTING CHANGES
        if 'late_night_ratio' in deviations:
            current_val = current.get('late_night_ratio', 0)
            baseline_val = baseline.get('late_night_ratio', 0)
            deviation_pct = deviations.get('late_night_ratio', 0)
            z_score = z_scores.get('late_night_ratio', 0)
            
            if abs(deviation_pct) > 50 and abs(z_score) > 1.0:
                change = "increased" if deviation_pct > 0 else "decreased"
                magnitude = describe_change(z_score)
                insights.append(
                    f"⚠️ Your late-night posting (10PM-6AM) has {magnitude} {change} from {baseline_val*100:.0f}% to {current_val*100:.0f}% "
                    f"({abs(deviation_pct):.0f}% change from YOUR normal pattern). "
                    f"{'This disrupted sleep schedule is a concerning indicator.' if deviation_pct > 50 else 'This improvement in sleep patterns is positive.'}"
                )
        
        # 2. POSTING FREQUENCY CHANGES
        if 'posting_frequency' in deviations:
            current_val = current.get('posting_frequency', 0)
            baseline_val = baseline.get('posting_frequency', 0)
            deviation_pct = deviations.get('posting_frequency', 0)
            z_score = z_scores.get('posting_frequency', 0)
            
            if abs(deviation_pct) > 40 and abs(z_score) > 1.0:
                change = "increased" if deviation_pct > 0 else "decreased"
                magnitude = describe_change(z_score)
                insights.append(
                    f"📊 You're posting {magnitude} more often than usual: {current_val:.1f} posts/day vs your typical {baseline_val:.1f} posts/day "
                    f"({abs(deviation_pct):.0f}% change). "
                    f"{'This increased activity may indicate rumination or difficulty sleeping.' if deviation_pct > 40 else 'Reduced posting frequency could indicate withdrawal.'}"
                )
        
        # 3. SENTIMENT CHANGES
        if 'avg_sentiment' in deviations:
            current_val = current.get('avg_sentiment', 0)
            baseline_val = baseline.get('avg_sentiment', 0)
            deviation_pct = deviations.get('avg_sentiment', 0)
            z_score = z_scores.get('avg_sentiment', 0)
            
            if abs(z_score) > 1.0:
                if current_val < baseline_val:
                    magnitude = describe_change(z_score)
                    insights.append(
                        f"💭 Your posts are {magnitude} more negative than your baseline (sentiment: {current_val:.2f} vs your usual {baseline_val:.2f}). "
                        f"This shift in emotional tone suggests you may be experiencing increased distress."
                    )
                else:
                    insights.append(
                        f"✓ Your posts show improved emotional tone ({current_val:.2f} vs baseline {baseline_val:.2f}). Keep up the positive momentum!"
                    )
        
        # 4. NEGATIVE POST RATIO CHANGES
        if 'negative_post_ratio' in deviations:
            current_val = current.get('negative_post_ratio', 0)
            baseline_val = baseline.get('negative_post_ratio', 0)
            deviation_pct = deviations.get('negative_post_ratio', 0)
            z_score = z_scores.get('negative_post_ratio', 0)
            
            if deviation_pct > 30 and z_score > 1.0:
                insights.append(
                    f"⚠️ {current_val*100:.0f}% of your recent posts are negative, compared to {baseline_val*100:.0f}% normally "
                    f"(+{deviation_pct:.0f}% increase). This sustained negative expression is a significant concern."
                )
        
        # 5. FIRST-PERSON PRONOUN CHANGES (research shows correlation with depression)
        if 'first_person_pronoun_ratio' in deviations:
            current_val = current.get('first_person_pronoun_ratio', 0)
            baseline_val = baseline.get('first_person_pronoun_ratio', 0)
            deviation_pct = deviations.get('first_person_pronoun_ratio', 0)
            z_score = z_scores.get('first_person_pronoun_ratio', 0)
            
            if deviation_pct > 25 and z_score > 1.0:
                insights.append(
                    f"🔍 Your self-focused language ('I', 'me', 'my') increased from {baseline_val*100:.1f}% to {current_val*100:.1f}% "
                    f"(+{deviation_pct:.0f}% above your norm). Research links this pattern to depressive rumination."
                )
        
        # 6. MENTAL HEALTH COMMUNITY ENGAGEMENT CHANGES
        if 'mental_health_participation' in deviations:
            current_val = current.get('mental_health_participation', 0)
            baseline_val = baseline.get('mental_health_participation', 0)
            deviation_pct = deviations.get('mental_health_participation', 0)
            z_score = z_scores.get('mental_health_participation', 0)
            
            if deviation_pct > 30 and z_score > 1.0:
                insights.append(
                    f"🤝 You've increased engagement in mental health communities from {baseline_val*100:.0f}% to {current_val*100:.0f}% of posts "
                    f"(+{deviation_pct:.0f}% increase). While seeking support is positive, the sharp increase suggests you may be struggling more than usual."
                )
        
        # 7. ENGAGEMENT/SCORE CHANGES
        if 'avg_score' in deviations:
            current_val = current.get('avg_score', 0)
            baseline_val = baseline.get('avg_score', 0)
            deviation_pct = deviations.get('avg_score', 0)
            z_score = z_scores.get('avg_score', 0)
            
            if deviation_pct < -40 and z_score < -1.0:
                insights.append(
                    f"📉 Your post engagement dropped from {baseline_val:.1f} to {current_val:.1f} average score "
                    f"({abs(deviation_pct):.0f}% decrease). This may indicate you're feeling less connected to your communities."
                )
        
        # 8. OVERALL PATTERN INTERPRETATION based on risk level
        if risk_level == "elevated":
            insights.append(
                f"⚠️ PERSONALIZED ALERT: Multiple behavioral indicators show significant deviations from YOUR normal patterns. "
                f"These changes are specific to you - not based on population averages. Professional support is strongly recommended."
            )
        else:
            insights.append(
                f"✓ Your behavioral patterns remain relatively consistent with your established baseline. Continue monitoring your mental well-being."
            )
        
        # Add fallback if no significant deviations detected
        if len(insights) == 0:
            insights.append(
                f"Your current behavior is consistent with your established baseline. No significant deviations detected."
            )
        
        return insights
        
        # First-person pronoun insights (research shows correlation with depression)
        fp_ratio = behavioral_features.get('first_person_pronoun_ratio', 0)
        if fp_ratio > 0.12:
            insights.append(f"High self-focused language detected ({fp_ratio*100:.1f}% first-person pronouns). Research shows this can correlate with depressive states - consider discussing with a professional.")
        elif fp_ratio > 0.08:
            insights.append(f"Elevated self-referential language ({fp_ratio*100:.1f}% 'I', 'me', 'my'). This can indicate increased self-focus during stress.")
        
        # Mental health community engagement
        mh_participation = behavioral_features.get('mental_health_participation', 0)
        if mh_participation > 0.7:
            insights.append(f"You're very actively engaged in mental health communities ({mh_participation*100:.0f}% of posts). This shows you're seeking support, which is a positive step.")
        elif mh_participation > 0.4:
            insights.append(f"Significant engagement with mental health communities ({mh_participation*100:.0f}% of posts). You're taking the right step by seeking peer support.")
        elif mh_participation > 0.2:
            insights.append(f"Moderate mental health community engagement ({mh_participation*100:.0f}%). These communities can provide valuable peer support.")
        
        # Subreddit diversity insights
        unique_subs = behavioral_features.get('unique_subreddits', 0)
        if unique_subs < 3:
            insights.append(f"Limited community diversity ({unique_subs} subreddits). Exploring varied interests can provide mental relief and perspective.")
        elif unique_subs > 10:
            insights.append(f"You're active across many communities ({unique_subs} subreddits), showing diverse interests - this is generally healthy.")
        
        # Engagement insights
        avg_score = behavioral_features.get('avg_score', 0)
        if avg_score < 1:
            insights.append(f"Your posts receive low engagement (avg score: {avg_score:.1f}). This isn't necessarily negative, but ensure you feel heard and supported.")
        elif avg_score > 10:
            insights.append(f"Your posts receive strong community engagement (avg score: {avg_score:.1f}), indicating good community connection.")
        
        # Overall pattern insights based on risk level
        if risk_level == "elevated":
            insights.append("⚠️ Multiple behavioral indicators suggest you may be experiencing mental health challenges. Professional support is strongly recommended.")
        else:
            insights.append("✓ Overall behavioral patterns are within healthy ranges. Continue monitoring your mental well-being.")
        
        return insights
        """
        Combine user's Reddit activity into a single text for analysis
        
        Args:
            activity_data: Dictionary containing user activity
            
        Returns:
            Combined text string for model input
        """
        text_parts = []
        
        # Add comments
        for comment in activity_data.get("comments", []):
            text_parts.append(comment["body"])
        
        # Add submissions
        for submission in activity_data.get("submissions", []):
            text_parts.append(submission["title"])
            if submission["selftext"]:
                text_parts.append(submission["selftext"])
        
        # Combine with spaces
        combined_text = " ".join(text_parts)
        
        # Limit to reasonable length (model can handle 512 tokens)
        # ~4 chars per token average, so ~2000 chars is safe
        max_chars = 10000
        if len(combined_text) > max_chars:
            logger.info(f"Truncating text from {len(combined_text)} to {max_chars} chars")
            combined_text = combined_text[:max_chars]
        
        return combined_text

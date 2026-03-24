"""
Analysis Routes
Handles Reddit data fetching and ML analysis
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.utils.auth import get_current_user
from app.services.reddit_service import RedditService
from app.services.model_service import get_model_service
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()


class AnalysisRequest(BaseModel):
    """Request model for analysis"""
    reddit_username: str = Field(min_length=3, max_length=64)
    limit: int = 100  # Number of posts/comments to fetch


class ManualUploadRequest(BaseModel):
    """Request model for manual data upload"""
    user_id: str
    features: dict
    posts: list
    label: int | None = None
    ground_truth_label: int | None = None
    label_confidence: float | None = None


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    username: str
    risk_level: str
    confidence: float
    probabilities: dict
    account_info: dict
    stats: dict
    recommendations: list[str]
    timestamp: str


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_user_activity(
    request: AnalysisRequest,
    user: dict = Depends(get_current_user)
):
    """
    Fetch user's Reddit activity and perform ML analysis
    
    Returns:
        - Risk assessment results
        - User statistics
        - Recommendations based on risk level
    """
    try:
        logger.info(f"Starting analysis for app user: {user['username']} and reddit user: {request.reddit_username}")
        
        # Debug: Log what's in the user dict
        logger.debug(f"User dict keys: {user.keys()}")
        logger.debug(f"User dict: {user}")
        
        # Fetch Reddit user activity by public username
        logger.info("Fetching Reddit activity...")
        try:
            activity_data = RedditService.fetch_user_activity_by_username(
                username=request.reddit_username,
                limit=request.limit,
                include_comments=True,
                include_submissions=True
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Failed to fetch Reddit activity: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Reddit data: {str(e)}"
            )
        
        # Validate data sufficiency (research paper requirements)
        logger.info("Validating data sufficiency...")
        validation = RedditService.validate_data_sufficiency(activity_data)
        
        if not validation['sufficient']:
            logger.warning(f"Insufficient data: {validation['reason']}")
            
            # Construct helpful error response
            error_detail = {
                "error": "insufficient_data",
                "message": validation['reason'],
                "progress": validation['progress'],
                "requirements": {
                    "min_posts": 40,
                    "min_days": 30,
                    "min_stability": 0.70
                },
                "guidance": [
                    "Keep posting regularly on Reddit to build your behavioral baseline",
                    "Analysis requires at least 40 posts over a 30-day period",
                    "Consistent posting patterns improve baseline stability",
                    "Check back when you have more posting history"
                ],
                "resources": [
                    {"name": "National Suicide Prevention Lifeline", "contact": "988"},
                    {"name": "Crisis Text Line", "contact": "Text HOME to 741741"},
                    {"name": "SAMHSA National Helpline", "contact": "1-800-662-4357"}
                ]
            }
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )
        
        logger.info(f"Data validation passed. Baseline stability: {validation['baseline_stability']:.2f}")
        
        # Prepare text for analysis
        logger.info("Preparing text for model...")
        combined_text = RedditService.prepare_text_for_analysis(activity_data)
        
        # Calculate behavioral features (8 features as per research paper)
        logger.info("Calculating behavioral features...")
        behavioral_features = RedditService.calculate_behavioral_features(activity_data)
        logger.debug(f"Behavioral features: {behavioral_features}")
        
        # Get model prediction with behavioral features
        logger.info("Running ML model prediction...")
        model_service = get_model_service()
        try:
            prediction = model_service.predict(combined_text, behavioral_features)
        except Exception as e:
            logger.error(f"Model prediction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {str(e)}"
            )
        
        # Generate recommendations based on risk level
        recommendations = generate_recommendations(prediction["risk_level"])
        
        # Generate personalized insights
        insights = RedditService.generate_personalized_insights(
            behavioral_features, 
            prediction["risk_level"]
        )
        
        # Prepare response
        from datetime import datetime
        response = AnalysisResponse(
            username=activity_data["username"],
            risk_level=prediction["risk_level"],
            confidence=prediction["confidence"],
            probabilities=prediction["probabilities"],
            account_info={
                "account_created": activity_data["account_created"],
                "karma": activity_data["karma"]
            },
            stats={
                **activity_data["stats"],
                "behavioral_features": behavioral_features,
                "feature_analysis": prediction.get("feature_analysis", {}),
                "personalized_insights": insights,
                "baseline_stability": validation['baseline_stability'],
                "data_quality": {
                    "posts_analyzed": validation['progress'].get('posts', 0),
                    "temporal_span_days": validation['progress'].get('days', 0),
                    "stability_coefficient": validation['baseline_stability']
                }
            },
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        logger.info(f"Analysis complete for {user['username']}: {prediction['risk_level']} risk")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/analyze-upload", response_model=AnalysisResponse)
async def analyze_uploaded_data(
    request: ManualUploadRequest,
    user: dict = Depends(get_current_user)
):
    """
    Analyze manually uploaded user data (for testing without Reddit authentication)
    
    Args:
        request: ManualUploadRequest containing user_id, features, and posts
        
    Returns:
        - Risk assessment results
        - User statistics
        - Recommendations based on risk level
    """
    try:
        logger.info(f"Starting analysis for uploaded data: {request.user_id} by {user['username']}")
        logger.info(f"Upload contains {len(request.posts)} posts")

        def normalize_timestamp(raw_timestamp) -> str:
            if isinstance(raw_timestamp, (int, float)):
                return datetime.fromtimestamp(raw_timestamp, timezone.utc).isoformat()
            if isinstance(raw_timestamp, str):
                try:
                    numeric_ts = float(raw_timestamp)
                    return datetime.fromtimestamp(numeric_ts, timezone.utc).isoformat()
                except ValueError:
                    try:
                        parsed = datetime.fromisoformat(raw_timestamp)
                        if parsed.tzinfo is None:
                            parsed = parsed.replace(tzinfo=timezone.utc)
                        return parsed.isoformat()
                    except ValueError:
                        return datetime.now(timezone.utc).isoformat()
            return datetime.now(timezone.utc).isoformat()
        
        # Transform uploaded posts into RedditService format (comments/submissions)
        comments = []
        submissions = []
        
        for post in request.posts:
            post_type = post.get("type", "comment")
            post_text = post.get("text", "")
            normalized_created_utc = normalize_timestamp(post.get("timestamp", 0))
            
            # Create post object in Reddit API format
            post_obj = {
                "body" if post_type == "comment" else "selftext": post_text,
                "created_utc": normalized_created_utc,
                "subreddit": post.get("subreddit", "unknown"),
                "score": post.get("score", 0),
                "title": post.get("title", ""),
            }
            
            if post_type == "comment":
                comments.append(post_obj)
            else:
                submissions.append(post_obj)
        
        # Create activity_data in the format expected by downstream functions
        all_timestamps = [item.get("created_utc") for item in comments + submissions if item.get("created_utc")]
        account_created = min(all_timestamps) if all_timestamps else "N/A"

        activity_data = {
            "username": request.user_id,
            "comments": comments,
            "submissions": submissions,
            "account_created": account_created,
            "karma": {"post": 0, "comment": 0},
            "stats": {
                "total_comments": len(comments),
                "total_submissions": len(submissions),
                "total_text_length": sum(len(c.get("body", "")) for c in comments) + sum(len(s.get("selftext", "")) for s in submissions)
            }
        }
        
        logger.info(f"Transformed into {len(comments)} comments and {len(submissions)} submissions")
        
        # Validate data sufficiency (same gating as Reddit analysis)
        logger.info("Validating uploaded data sufficiency...")
        validation = RedditService.validate_data_sufficiency(activity_data)

        if not validation['sufficient']:
            logger.warning(f"Insufficient uploaded data: {validation['reason']}")
            error_detail = {
                "error": "insufficient_data",
                "message": validation['reason'],
                "progress": validation.get('progress', {}),
                "requirements": {
                    "min_posts": 40,
                    "min_days": 30,
                    "min_stability": 0.70
                },
                "guidance": [
                    "Upload at least 40 posts/comments spanning 30+ days",
                    "Include valid timestamps for each post",
                    "Ensure posting history reflects regular activity for stable baseline"
                ]
            }
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail
            )

        logger.info(f"Uploaded data validation passed. Baseline stability: {validation['baseline_stability']:.2f}")

        # Prepare text for model
        combined_text = RedditService.prepare_text_for_analysis(activity_data)
        logger.info(f"Combined text: {len(combined_text)} characters")
        
        # Calculate behavioral features from uploaded activity (same as Reddit analysis)
        behavioral_features = RedditService.calculate_behavioral_features(activity_data)
        
        # Run model prediction (prediction is based on TEXT content, not features)
        logger.info("Running ML model prediction...")
        model_service = get_model_service()
        try:
            prediction = model_service.predict(combined_text, behavioral_features)
            logger.info(f"Prediction: risk_level={prediction['risk_level']}, confidence={prediction['confidence']:.3f}")
        except Exception as e:
            logger.error(f"Model prediction failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis failed: {str(e)}"
            )
        
        # Generate recommendations and insights
        recommendations = generate_recommendations(prediction["risk_level"])
        insights = RedditService.generate_personalized_insights(behavioral_features, prediction["risk_level"])
        
        # Prepare response
        response = AnalysisResponse(
            username=activity_data["username"],
            risk_level=prediction["risk_level"],
            confidence=prediction["confidence"],
            probabilities=prediction["probabilities"],
            account_info={
                "account_created": activity_data["account_created"],
                "karma": activity_data["karma"]
            },
            stats={
                **activity_data["stats"],
                "behavioral_features": behavioral_features,
                "feature_analysis": prediction.get("feature_analysis", {}),
                "personalized_insights": insights,
                "baseline_stability": validation['baseline_stability'],
                "data_quality": {
                    "posts_analyzed": validation['progress'].get('posts', 0),
                    "temporal_span_days": validation['progress'].get('days', 0),
                    "stability_coefficient": validation['baseline_stability']
                }
            },
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
        logger.info(f"Analysis complete for {request.user_id}: {prediction['risk_level']} risk")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


def generate_recommendations(risk_level: str) -> list[str]:
    """
    Generate personalized recommendations based on risk level
    
    Args:
        risk_level: The predicted risk level (low, elevated)
        
    Returns:
        List of recommendation strings
    """
    if risk_level == "elevated":
        return [
            "Consider speaking with a mental health professional",
            "Reach out to trusted friends or family members",
            "Contact 988 Suicide & Crisis Lifeline (24/7 support)",
            "Practice self-care activities daily",
            "Join online or local mental health support groups",
            "Consider therapy or counseling services",
            "Monitor your mental health regularly"
        ]
    else:  # low risk
        return [
            "Continue maintaining healthy social connections",
            "Keep practicing self-care activities",
            "Stay aware of your mental health",
            "Reach out if you start feeling different",
            "Consider periodic check-ins with friends/family",
            "Maintain healthy Reddit usage habits"
        ]


@router.get("/status")
async def get_analysis_status(user: dict = Depends(get_current_user)):
    """
    Get model status and user's analysis eligibility
    """
    try:
        model_service = get_model_service()
        
        # Try to load model if not loaded
        if not model_service.loaded:
            model_loaded = model_service.load_model()
        else:
            model_loaded = True
        
        return {
            "model_loaded": model_loaded,
            "model_ready": model_loaded,
            "username": user["username"],
            "can_analyze": model_loaded
        }
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "model_loaded": False,
            "model_ready": False,
            "username": user["username"],
            "can_analyze": False,
            "error": str(e)
        }

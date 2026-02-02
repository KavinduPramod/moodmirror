"""
Analysis Routes
Handles Reddit data fetching and ML analysis
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.utils.auth import get_current_user
from app.services.reddit_service import RedditService
from app.services.model_service import get_model_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class AnalysisRequest(BaseModel):
    """Request model for analysis"""
    limit: int = 100  # Number of posts/comments to fetch


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
        logger.info(f"Starting analysis for user: {user['username']}")
        
        # Debug: Log what's in the user dict
        logger.debug(f"User dict keys: {user.keys()}")
        logger.debug(f"User dict: {user}")
        
        # Get Reddit access token from session
        access_token = user.get('reddit_access_token')
        if not access_token:
            logger.error(f"Reddit access token not found in session. Available keys: {list(user.keys())}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Reddit access token not found. Please re-authenticate."
            )
        
        # Fetch user activity from Reddit
        logger.info("Fetching Reddit activity...")
        try:
            activity_data = RedditService.fetch_user_activity(
                access_token=access_token,
                limit=request.limit,
                include_comments=True,
                include_submissions=True
            )
        except Exception as e:
            logger.error(f"Failed to fetch Reddit activity: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch Reddit data: {str(e)}"
            )
        
        # Validate data sufficiency (research paper requirements)
        from app.config import settings
        logger.info("Validating data sufficiency...")
        validation = RedditService.validate_data_sufficiency(activity_data)
        
        # Skip validation in demo mode for testing
        if settings.DEMO_MODE:
            logger.warning("DEMO MODE: Bypassing data sufficiency check")
            if not validation['sufficient']:
                logger.info(f"Would normally reject: {validation['reason']}")
                # Augment data with synthetic posts for demo
                activity_data = RedditService.generate_demo_data(activity_data, validation)
                validation['sufficient'] = True
                validation['baseline_stability'] = 0.75  # Synthetic stability
        
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
            timestamp=datetime.utcnow().isoformat()
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

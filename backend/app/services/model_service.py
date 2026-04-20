"""
Model Service
Handles ML model loading and predictions
"""

import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
from pathlib import Path
from app.config import settings
import logging
import numpy as np

logger = logging.getLogger(__name__)


class MoodMirrorModel(nn.Module):
    """
    BERT + BiLSTM + attention model used by the training notebook.
    """
    def __init__(self, lstm_hidden=256, lstm_layers=2, dropout=0.4, freeze_bert_layers=8, behavioral_dim=8):
        super().__init__()
        
        self.lstm_hidden = lstm_hidden
        self.lstm_layers = lstm_layers
        self.behavioral_dim = behavioral_dim

        # BERT encoder
        self.bert = AutoModel.from_pretrained('bert-base-uncased')

        for i, layer in enumerate(self.bert.encoder.layer):
            if i < freeze_bert_layers:
                for param in layer.parameters():
                    param.requires_grad = False

        for param in self.bert.embeddings.parameters():
            param.requires_grad = False
        
        # BiLSTM layer
        self.bilstm = nn.LSTM(
            input_size=self.bert.config.hidden_size,
            hidden_size=lstm_hidden,
            num_layers=lstm_layers,
            bidirectional=True,
            batch_first=True,
            dropout=dropout if lstm_layers > 1 else 0
        )
        
        self.attention = nn.Sequential(
            nn.Linear(lstm_hidden * 2, 128),
            nn.Tanh(),
            nn.Linear(128, 1)
        )

        classifier_input = lstm_hidden * 2 + behavioral_dim
        self.classifier = nn.Sequential(
            nn.Linear(classifier_input, 256),
            nn.LayerNorm(256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 2)
        )
        
    def forward(self, input_ids, attention_mask, behavioral_features):
        bert_output = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = bert_output.last_hidden_state  # (batch, seq_len, 768)
        
        lstm_out, _ = self.bilstm(sequence_output)

        attention_weights = torch.softmax(self.attention(lstm_out), dim=1)
        lstm_attended = torch.sum(lstm_out * attention_weights, dim=1)
        
        combined = torch.cat([lstm_attended, behavioral_features], dim=1)

        return self.classifier(combined)


class ModelService:
    """Service for loading and using the ML model"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.tokenizer = None
        self.scaler = None
        self.threshold = 0.5
        self.behavioral_feature_names = [
            'posting_frequency',
            'late_night_ratio',
            'avg_sentiment',
            'negative_post_ratio',
            'first_person_pronoun_ratio',
            'mental_health_participation',
            'unique_subreddits',
            'avg_score',
        ]
        self.loaded = False
        
    def load_model(self):
        """Load the trained model and tokenizer"""
        try:
            model_path = Path(settings.MODEL_PATH)
            
            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return False
            
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)

            if not isinstance(checkpoint, dict):
                raise ValueError(f"Unexpected checkpoint type: {type(checkpoint)}")

            model_config = checkpoint.get('model_config', {})
            self.threshold = float(checkpoint.get('threshold', 0.5))
            self.scaler = checkpoint.get('scaler')
            self.behavioral_feature_names = list(
                checkpoint.get('behavioral_features') or self.behavioral_feature_names
            )

            self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')

            self.model = MoodMirrorModel(
                lstm_hidden=model_config.get('lstm_hidden', 256),
                lstm_layers=model_config.get('lstm_layers', 2),
                dropout=model_config.get('dropout', 0.4),
                freeze_bert_layers=model_config.get('freeze_bert_layers', 8),
                behavioral_dim=len(self.behavioral_feature_names),
            )

            state_dict = checkpoint.get('model_state_dict', checkpoint)
            missing_keys, unexpected_keys = self.model.load_state_dict(state_dict, strict=False)
            if missing_keys:
                logger.warning(f"Missing model keys: {missing_keys[:10]}")
            if unexpected_keys:
                logger.warning(f"Unexpected model keys: {unexpected_keys[:10]}")
            logger.info("Model weights loaded from checkpoint")
            
            self.model.to(self.device)
            self.model.eval()
            
            self.loaded = True
            logger.info(f"Model loaded successfully from {model_path}")
            logger.info(f"Using device: {self.device}")
            logger.info(f"Using threshold: {self.threshold:.3f}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def predict(self, text: str, behavioral_features: dict = None) -> dict:
        """
        Make prediction on input text with optional behavioral features
        
        Args:
            text: User's combined Reddit posts/comments
            behavioral_features: Dict with 8 behavioral features (optional)
            
        Returns:
            dict with prediction, confidence, risk_level, and feature interpretation
        """
        if not self.loaded:
            if not self.load_model():
                raise Exception("Model not loaded")
        
        try:
            # Tokenize input
            encoding = self.tokenizer(
                text,
                add_special_tokens=True,
                max_length=256,
                padding='max_length',
                truncation=True,
                return_tensors='pt'
            )
            
            input_ids = encoding['input_ids'].to(self.device)
            attention_mask = encoding['attention_mask'].to(self.device)
            behavioral_tensor = self._prepare_behavioral_features(behavioral_features or {})
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_ids, attention_mask, behavioral_tensor)
                probabilities = torch.softmax(outputs, dim=1)
                severe_probability = probabilities[0][1].item()
                predicted_class = 1 if severe_probability >= self.threshold else 0
                confidence = probabilities[0][predicted_class].item()
            
            # Map prediction to risk level
            risk_mapping = {
                0: "low",      # No mental health concerns detected
                1: "elevated"  # Potential mental health concerns detected
            }
            
            risk_level = risk_mapping.get(predicted_class, "unknown")
            
            result = {
                "prediction": predicted_class,
                "risk_level": risk_level,
                "confidence": round(confidence * 100, 2),
                "probabilities": {
                    "low_risk": round(probabilities[0][0].item() * 100, 2),
                    "elevated_risk": round(probabilities[0][1].item() * 100, 2)
                }
            }
            
            # Add feature interpretation if behavioral features provided
            if behavioral_features:
                result["feature_analysis"] = self._interpret_features(behavioral_features, risk_level)
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise

    def _prepare_behavioral_features(self, features: dict) -> torch.Tensor:
        feature_values = np.array([
            float(features.get(name, 0.0)) for name in self.behavioral_feature_names
        ], dtype=np.float32).reshape(1, -1)

        if self.scaler is not None:
            try:
                feature_values = self.scaler.transform(feature_values)
            except Exception as exc:
                logger.warning(f"Behavioral feature scaling failed; using raw values: {exc}")

        return torch.tensor(feature_values, dtype=torch.float32, device=self.device)
    
    def _interpret_features(self, features: dict, risk_level: str) -> dict:
        """
        Interpret behavioral features based on research paper thresholds
        
        Args:
            features: Dictionary of calculated behavioral features
            risk_level: Predicted risk level
            
        Returns:
            Dictionary with feature interpretations and alerts
        """
        alerts = []
        interpretations = {}
        
        # Late night activity (>50% is concerning)
        if features.get('late_night_ratio', 0) > 0.5:
            alerts.append("High late-night activity detected (10PM-6AM)")
            interpretations['late_night'] = 'high'
        elif features.get('late_night_ratio', 0) > 0.3:
            interpretations['late_night'] = 'moderate'
        else:
            interpretations['late_night'] = 'normal'
        
        # Negative sentiment (< -0.3 is concerning)
        if features.get('avg_sentiment', 0) < -0.3:
            alerts.append("Predominantly negative sentiment detected")
            interpretations['sentiment'] = 'negative'
        elif features.get('avg_sentiment', 0) < 0:
            interpretations['sentiment'] = 'slightly_negative'
        else:
            interpretations['sentiment'] = 'positive'
        
        # Negative post ratio (>50% is high)
        if features.get('negative_post_ratio', 0) > 0.5:
            alerts.append("High proportion of negative posts")
            interpretations['negative_ratio'] = 'high'
        elif features.get('negative_post_ratio', 0) > 0.3:
            interpretations['negative_ratio'] = 'moderate'
        else:
            interpretations['negative_ratio'] = 'normal'
        
        # First person pronoun usage (>0.1 is elevated, research finding)
        if features.get('first_person_pronoun_ratio', 0) > 0.1:
            alerts.append("Elevated first-person pronoun usage")
            interpretations['pronouns'] = 'elevated'
        else:
            interpretations['pronouns'] = 'normal'
        
        # Mental health participation (>50% is significant)
        mh_participation = features.get('mental_health_participation', 0)
        if mh_participation > 0.5:
            alerts.append("High mental health community engagement")
            interpretations['mh_engagement'] = 'high'
        elif mh_participation > 0.2:
            interpretations['mh_engagement'] = 'moderate'
        else:
            interpretations['mh_engagement'] = 'low'
        
        # Posting frequency (very high or very low can be concerning)
        post_freq = features.get('posting_frequency', 0)
        if post_freq > 10:
            alerts.append("Very high posting frequency")
            interpretations['frequency'] = 'very_high'
        elif post_freq > 5:
            interpretations['frequency'] = 'high'
        elif post_freq < 0.5:
            interpretations['frequency'] = 'low'
        else:
            interpretations['frequency'] = 'normal'
        
        # Unique subreddits (low diversity can indicate fixation)
        unique_subs = features.get('unique_subreddits', 0)
        if unique_subs < 3:
            alerts.append("Limited subreddit diversity")
            interpretations['diversity'] = 'low'
        elif unique_subs < 5:
            interpretations['diversity'] = 'moderate'
        else:
            interpretations['diversity'] = 'high'
        
        return {
            "alerts": alerts,
            "interpretations": interpretations,
            "feature_scores": features
        }


# Global model service instance
model_service = ModelService()


def get_model_service() -> ModelService:
    """Get the model service instance"""
    return model_service

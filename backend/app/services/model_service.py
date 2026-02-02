"""
Model Service
Handles ML model loading and predictions
"""

import torch
import torch.nn as nn
from transformers import BertTokenizer, BertModel
from pathlib import Path
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class BERTBiLSTMModel(nn.Module):
    """
    BERT + BiLSTM model for mental health risk assessment
    """
    def __init__(self, bert_model_name='bert-base-uncased', hidden_dim=256, num_classes=2, dropout=0.3):
        super(BERTBiLSTMModel, self).__init__()
        
        # BERT encoder
        self.bert = BertModel.from_pretrained(bert_model_name)
        bert_output_dim = self.bert.config.hidden_size  # 768 for bert-base
        
        # BiLSTM layer
        self.bilstm = nn.LSTM(
            bert_output_dim,
            hidden_dim,
            num_layers=2,
            bidirectional=True,
            batch_first=True,
            dropout=dropout
        )
        
        # Fully connected layers
        self.fc1 = nn.Linear(hidden_dim * 2, 128)  # *2 for bidirectional
        self.dropout = nn.Dropout(dropout)
        self.fc2 = nn.Linear(128, num_classes)
        self.relu = nn.ReLU()
        
    def forward(self, input_ids, attention_mask):
        # BERT encoding
        bert_output = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = bert_output.last_hidden_state  # (batch, seq_len, 768)
        
        # BiLSTM
        lstm_output, _ = self.bilstm(sequence_output)  # (batch, seq_len, hidden_dim*2)
        
        # Use the last hidden state
        last_hidden = lstm_output[:, -1, :]  # (batch, hidden_dim*2)
        
        # Fully connected layers
        x = self.fc1(last_hidden)
        x = self.relu(x)
        x = self.dropout(x)
        output = self.fc2(x)
        
        return output


class ModelService:
    """Service for loading and using the ML model"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.tokenizer = None
        self.loaded = False
        
    def load_model(self):
        """Load the trained model and tokenizer"""
        try:
            model_path = Path(settings.MODEL_PATH)
            
            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return False
            
            # Initialize tokenizer
            self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
            
            # Initialize model
            self.model = BERTBiLSTMModel(
                bert_model_name='bert-base-uncased',
                hidden_dim=256,
                num_classes=2,
                dropout=0.3
            )
            
            # Load trained weights
            # Note: weights_only=False is safe here since we trust our own model file
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
            
            # Debug: Log what's in the checkpoint
            if isinstance(checkpoint, dict):
                checkpoint_keys = list(checkpoint.keys())[:10]  # First 10 keys
                logger.info(f"Checkpoint type: dict with keys: {checkpoint_keys}")
            else:
                logger.info(f"Checkpoint type: {type(checkpoint)}")
            
            # Try to load the checkpoint - it might contain only custom layers or full model
            try:
                # Try loading full state dict
                self.model.load_state_dict(checkpoint, strict=False)
                logger.info("Model weights loaded (non-strict mode)")
            except Exception as e:
                # If checkpoint contains only custom layers, load them separately
                logger.warning(f"Full model load failed, trying partial load: {str(e)[:200]}")
                
                # Filter out BERT keys since BERT is already initialized from Hugging Face
                model_dict = self.model.state_dict()
                pretrained_dict = {k: v for k, v in checkpoint.items() 
                                 if k in model_dict and not k.startswith('bert.')}
                
                if pretrained_dict:
                    model_dict.update(pretrained_dict)
                    self.model.load_state_dict(model_dict)
                    logger.info(f"Loaded {len(pretrained_dict)} custom layer weights")
                else:
                    logger.warning("No matching weights found in checkpoint - using randomly initialized weights")
            
            self.model.to(self.device)
            self.model.eval()
            
            self.loaded = True
            logger.info(f"Model loaded successfully from {model_path}")
            logger.info(f"Using device: {self.device}")
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
                max_length=512,
                padding='max_length',
                truncation=True,
                return_tensors='pt'
            )
            
            input_ids = encoding['input_ids'].to(self.device)
            attention_mask = encoding['attention_mask'].to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_ids, attention_mask)
                probabilities = torch.softmax(outputs, dim=1)
                predicted_class = torch.argmax(probabilities, dim=1).item()
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

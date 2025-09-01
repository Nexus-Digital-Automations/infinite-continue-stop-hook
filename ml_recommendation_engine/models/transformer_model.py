"""
Financial Transformer Recommendation Engine

Advanced neural network architecture using Transformers specifically designed
for financial time-series data and investment recommendations.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.nn import TransformerEncoder, TransformerEncoderLayer
import math
import logging

logger = logging.getLogger(__name__)


class PositionalEncoding(nn.Module):
    """Positional encoding for time-series financial data"""

    def __init__(self, d_model, dropout=0.1, max_len=5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)

        self.register_buffer("pe", pe)

    def forward(self, x):
        """Apply positional encoding to input tensor"""
        x = x + self.pe[: x.size(0), :]
        return self.dropout(x)


class MultiHeadFinancialAttention(nn.Module):
    """Multi-head attention with financial-specific modifications"""

    def __init__(self, d_model, nhead, dropout=0.1):
        super().__init__()
        self.multihead_attn = nn.MultiheadAttention(
            d_model, nhead, dropout=dropout, batch_first=True
        )
        self.dropout = nn.Dropout(dropout)
        self.norm = nn.LayerNorm(d_model)

    def forward(self, x, attention_mask=None):
        """Forward pass with residual connection and normalization"""
        attn_output, attn_weights = self.multihead_attn(
            x, x, x, attn_mask=attention_mask
        )

        # Residual connection and normalization
        x = self.norm(x + self.dropout(attn_output))

        return x, attn_weights


class FinancialFeatureEncoder(nn.Module):
    """Encode different types of financial features"""

    def __init__(self, d_model=512):
        super().__init__()
        self.d_model = d_model

        # Feature-specific encoders
        self.price_encoder = nn.Sequential(
            nn.Linear(1, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 4, d_model // 4),
        )

        self.volume_encoder = nn.Sequential(
            nn.Linear(1, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 4, d_model // 4),
        )

        self.technical_encoder = nn.Sequential(
            nn.Linear(20, d_model // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, d_model // 2),
        )

        self.fundamental_encoder = nn.Sequential(
            nn.Linear(15, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 4, d_model // 4),
        )

        # Feature fusion layer
        self.fusion_layer = nn.Sequential(
            nn.Linear(d_model, d_model), nn.ReLU(), nn.Dropout(0.1)
        )

    def forward(self, price_data, volume_data, technical_data, fundamental_data):
        """Encode and combine different financial features"""

        # Encode individual features
        price_emb = self.price_encoder(price_data)
        volume_emb = self.volume_encoder(volume_data)
        tech_emb = self.technical_encoder(technical_data)
        fund_emb = self.fundamental_encoder(fundamental_data)

        # Concatenate embeddings
        combined_features = torch.cat(
            [price_emb, volume_emb, tech_emb, fund_emb], dim=-1
        )

        # Apply fusion layer
        fused_features = self.fusion_layer(combined_features)

        return fused_features


class RiskAwareRecommendationHead(nn.Module):
    """Risk-aware recommendation head with confidence estimation"""

    def __init__(self, d_model, num_assets, num_risk_factors=5):
        super().__init__()
        self.d_model = d_model
        self.num_assets = num_assets
        self.num_risk_factors = num_risk_factors

        # Recommendation layers
        self.recommendation_head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(d_model // 2, num_assets),
        )

        # Confidence estimation
        self.confidence_head = nn.Sequential(
            nn.Linear(d_model, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(d_model // 4, 1),
        )

        # Risk assessment
        self.risk_head = nn.Sequential(
            nn.Linear(d_model, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(d_model // 4, num_risk_factors),
        )

        # Market regime detection
        self.regime_head = nn.Sequential(
            nn.Linear(d_model, d_model // 4),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(d_model // 4, 3),  # Bull, Bear, Sideways
        )

    def forward(self, x):
        """Generate recommendations with confidence and risk assessment"""

        # Generate recommendations
        raw_recommendations = self.recommendation_head(x)
        recommendations = F.softmax(raw_recommendations, dim=-1)

        # Confidence estimation
        confidence = torch.sigmoid(self.confidence_head(x))

        # Risk assessment
        risk_scores = F.softmax(self.risk_head(x), dim=-1)

        # Market regime detection
        regime_probs = F.softmax(self.regime_head(x), dim=-1)

        return {
            "recommendations": recommendations,
            "confidence": confidence,
            "risk_scores": risk_scores,
            "regime_probs": regime_probs,
            "raw_logits": raw_recommendations,
        }


class FinancialTransformerRecommendationEngine(nn.Module):
    """
    Complete Financial Transformer Recommendation Engine

    Features:
    - Multi-modal financial feature encoding
    - Transformer-based temporal modeling
    - Risk-aware recommendation generation
    - Confidence estimation and market regime detection
    """

    def __init__(
        self,
        d_model=512,
        nhead=8,
        num_encoder_layers=6,
        dim_feedforward=2048,
        dropout=0.1,
        num_assets=1000,
        sequence_length=60,
        num_risk_factors=5,
    ):
        super().__init__()

        self.d_model = d_model
        self.num_assets = num_assets
        self.sequence_length = sequence_length

        logger.info(
            f"Initializing FinancialTransformerRecommendationEngine with "
            f"d_model={d_model}, nhead={nhead}, layers={num_encoder_layers}"
        )

        # Feature encoding
        self.feature_encoder = FinancialFeatureEncoder(d_model)

        # Positional encoding for time series
        self.positional_encoding = PositionalEncoding(d_model, dropout)

        # Transformer encoder
        encoder_layers = TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
        )
        self.transformer_encoder = TransformerEncoder(
            encoder_layers, num_encoder_layers
        )

        # Risk-aware recommendation head
        self.recommendation_head = RiskAwareRecommendationHead(
            d_model, num_assets, num_risk_factors
        )

        # Initialize weights
        self.init_weights()

    def init_weights(self):
        """Initialize model weights using Xavier initialization"""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
            elif isinstance(module, nn.MultiheadAttention):
                nn.init.xavier_uniform_(module.in_proj_weight)
                nn.init.xavier_uniform_(module.out_proj.weight)

        logger.info("Model weights initialized using Xavier uniform initialization")

    def create_attention_mask(self, sequence_length, device):
        """Create causal attention mask for autoregressive prediction"""
        mask = torch.triu(torch.ones(sequence_length, sequence_length), diagonal=1)
        mask = mask.masked_fill(mask == 1, float("-inf"))
        return mask.to(device)

    def forward(
        self,
        price_data,
        volume_data,
        technical_data,
        fundamental_data,
        return_attention=False,
    ):
        """
        Forward pass through the Financial Transformer

        Args:
            price_data: [batch_size, sequence_length, 1] - Price time series
            volume_data: [batch_size, sequence_length, 1] - Volume time series
            technical_data: [batch_size, sequence_length, 20] - Technical indicators
            fundamental_data: [batch_size, sequence_length, 15] - Fundamental ratios
            return_attention: bool - Whether to return attention weights

        Returns:
            Dictionary containing recommendations, confidence, risk scores, and regime probabilities
        """

        batch_size, seq_len = price_data.size(0), price_data.size(1)
        device = price_data.device

        logger.debug(f"Forward pass: batch_size={batch_size}, seq_len={seq_len}")

        # Feature encoding and fusion
        encoded_features = self.feature_encoder(
            price_data, volume_data, technical_data, fundamental_data
        )

        # Add positional encoding
        src = self.positional_encoding(encoded_features)

        # Create attention mask for causal prediction
        attention_mask = self.create_attention_mask(seq_len, device)

        # Transformer encoding
        transformer_output = self.transformer_encoder(src, mask=attention_mask)

        # Use the last time step for prediction
        final_representation = transformer_output[:, -1, :]

        # Generate recommendations
        outputs = self.recommendation_head(final_representation)

        if return_attention:
            # Extract attention weights (simplified for demonstration)
            # In practice, you'd need to modify TransformerEncoder to return weights
            outputs["attention_weights"] = None

        return outputs

    def predict_step(
        self,
        price_data,
        volume_data,
        technical_data,
        fundamental_data,
        temperature=1.0,
        top_k=10,
    ):
        """
        Single prediction step with temperature scaling and top-k filtering

        Args:
            temperature: Controls randomness in recommendations (lower = more conservative)
            top_k: Number of top recommendations to return
        """

        with torch.no_grad():
            outputs = self.forward(
                price_data, volume_data, technical_data, fundamental_data
            )

            # Apply temperature scaling
            scaled_logits = outputs["raw_logits"] / temperature
            scaled_probs = F.softmax(scaled_logits, dim=-1)

            # Get top-k recommendations
            top_k_probs, top_k_indices = torch.topk(scaled_probs, top_k, dim=-1)

            return {
                "top_k_assets": top_k_indices,
                "top_k_probabilities": top_k_probs,
                "confidence": outputs["confidence"],
                "risk_scores": outputs["risk_scores"],
                "regime_probs": outputs["regime_probs"],
            }

    def get_model_size(self):
        """Get model size in parameters and memory"""
        param_count = sum(p.numel() for p in self.parameters())
        param_size = sum(p.numel() * p.element_size() for p in self.parameters())

        return {
            "parameters": param_count,
            "size_mb": param_size / (1024**2),
            "trainable_parameters": sum(
                p.numel() for p in self.parameters() if p.requires_grad
            ),
        }

    def save_model(self, path, include_optimizer_state=False, **metadata):
        """Save model with comprehensive metadata"""

        model_info = self.get_model_size()

        save_dict = {
            "model_state_dict": self.state_dict(),
            "model_config": {
                "d_model": self.d_model,
                "num_assets": self.num_assets,
                "sequence_length": self.sequence_length,
            },
            "model_info": model_info,
            "metadata": metadata,
        }

        torch.save(save_dict, path)
        logger.info(
            f"Model saved to {path} with {model_info['parameters']:,} parameters"
        )

    @classmethod
    def load_model(cls, path, device="cpu"):
        """Load model from checkpoint"""

        checkpoint = torch.load(path, map_location=device)
        config = checkpoint["model_config"]

        model = cls(**config)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(device)

        logger.info(f"Model loaded from {path} to device {device}")

        return model, checkpoint.get("metadata", {})


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Initialize model
    model = FinancialTransformerRecommendationEngine(
        d_model=512, nhead=8, num_encoder_layers=6, num_assets=1000, sequence_length=60
    )

    # Test forward pass
    batch_size = 4
    sequence_length = 60

    # Generate dummy data
    price_data = torch.randn(batch_size, sequence_length, 1)
    volume_data = torch.randn(batch_size, sequence_length, 1)
    technical_data = torch.randn(batch_size, sequence_length, 20)
    fundamental_data = torch.randn(batch_size, sequence_length, 15)

    # Forward pass
    outputs = model(price_data, volume_data, technical_data, fundamental_data)

    print(f"Model size: {model.get_model_size()}")
    print(f"Recommendations shape: {outputs['recommendations'].shape}")
    print(f"Confidence shape: {outputs['confidence'].shape}")
    print(f"Risk scores shape: {outputs['risk_scores'].shape}")
    print(f"Regime probs shape: {outputs['regime_probs'].shape}")

    # Test prediction step
    predictions = model.predict_step(
        price_data,
        volume_data,
        technical_data,
        fundamental_data,
        temperature=0.8,
        top_k=10,
    )

    print(f"Top-10 predictions shape: {predictions['top_k_assets'].shape}")
    print("✅ Financial Transformer model test completed successfully")

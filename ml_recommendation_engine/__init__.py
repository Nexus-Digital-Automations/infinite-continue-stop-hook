"""
ML Recommendation Engine for Financial AI Platform

A comprehensive machine learning recommendation system designed specifically
for financial data and investment recommendations.
"""

__version__ = "1.0.0"
__author__ = "Claude Code Assistant"
__description__ = "ML-based recommendation system using neural networks"

from .models import FinancialTransformerRecommendationEngine
from .inference import RealtimeRecommendationEngine
from .training import FinancialRecommendationTrainer

__all__ = [
    "FinancialTransformerRecommendationEngine",
    "RealtimeRecommendationEngine",
    "FinancialRecommendationTrainer",
]

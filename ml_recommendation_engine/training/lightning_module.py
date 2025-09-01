"""
PyTorch Lightning module for Financial Recommendation Engine

Wraps the Financial Transformer model with Lightning functionality for
easy training, validation, and testing with comprehensive metrics.
"""

import torch
import torch.nn.functional as F
import pytorch_lightning as pl
from torch.optim import AdamW, Adam
from torch.optim.lr_scheduler import ReduceLROnPlateau, CosineAnnealingLR
import logging
from typing import Dict, Any, Optional, Union, List
import numpy as np
from pathlib import Path

from ..models.transformer_model import FinancialTransformerRecommendationEngine
from .metrics import FinancialMetrics, MetricsTracker

logger = logging.getLogger(__name__)


class FinancialLightningModule(pl.LightningModule):
    """
    PyTorch Lightning wrapper for Financial Transformer Recommendation Engine

    Features:
    - Multi-task learning with weighted losses
    - Financial-specific metrics tracking
    - Adaptive learning rate scheduling
    - Gradient clipping and regularization
    - Comprehensive logging and checkpointing
    """

    def __init__(
        self,
        model_config: Dict[str, Any],
        learning_rate: float = 1e-4,
        weight_decay: float = 1e-5,
        optimizer: str = "adamw",
        scheduler: str = "reduce_on_plateau",
        scheduler_config: Optional[Dict[str, Any]] = None,
        loss_weights: Optional[Dict[str, float]] = None,
        gradient_clip_val: float = 1.0,
        risk_free_rate: float = 0.02,
        trading_cost: float = 0.001,
        warmup_epochs: int = 5,
        patience: int = 10,
        monitor_metric: str = "val_sharpe_ratio",
        mode: str = "max",
        save_top_k: int = 3,
    ):
        """
        Initialize Financial Lightning Module

        Args:
            model_config: Configuration for the underlying model
            learning_rate: Initial learning rate
            weight_decay: Weight decay for regularization
            optimizer: Optimizer type ("adamw", "adam")
            scheduler: LR scheduler type ("reduce_on_plateau", "cosine")
            scheduler_config: Additional scheduler configuration
            loss_weights: Weights for different loss components
            gradient_clip_val: Gradient clipping value
            risk_free_rate: Risk-free rate for financial metrics
            trading_cost: Trading cost for performance calculations
            warmup_epochs: Number of warmup epochs
            patience: Early stopping patience
            monitor_metric: Metric to monitor for best model selection
            mode: "min" or "max" for metric monitoring
            save_top_k: Number of best checkpoints to save
        """
        super().__init__()

        # Save hyperparameters
        self.save_hyperparameters()

        # Initialize model
        self.model = FinancialTransformerRecommendationEngine(**model_config)

        # Training configuration
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        self.optimizer_name = optimizer
        self.scheduler_name = scheduler
        self.scheduler_config = scheduler_config or {}
        self.gradient_clip_val = gradient_clip_val
        self.warmup_epochs = warmup_epochs
        self.current_epoch_num = 0

        # Loss configuration
        self.loss_weights = loss_weights or {
            "recommendation": 1.0,
            "confidence": 0.3,
            "risk": 0.2,
            "regime": 0.1,
        }

        # Metrics tracking
        self.metrics_calculator = FinancialMetrics(
            risk_free_rate=risk_free_rate, trading_cost=trading_cost
        )
        self.train_metrics_tracker = MetricsTracker()
        self.val_metrics_tracker = MetricsTracker()

        # Best model tracking
        self.monitor_metric = monitor_metric
        self.mode = mode
        self.best_metric_value = float("-inf") if mode == "max" else float("inf")

        logger.info(
            f"FinancialLightningModule initialized with model: "
            f"{self.model.__class__.__name__}, "
            f"optimizer: {optimizer}, scheduler: {scheduler}"
        )

    def forward(
        self,
        price_data: torch.Tensor,
        volume_data: torch.Tensor,
        technical_data: torch.Tensor,
        fundamental_data: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """Forward pass through the model"""
        return self.model(price_data, volume_data, technical_data, fundamental_data)

    def _calculate_recommendation_loss(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        confidence: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """Calculate recommendation loss with optional confidence weighting"""

        # Primary recommendation loss (MSE for regression-like task)
        mse_loss = F.mse_loss(predictions, targets)

        # Add ranking loss (encourage correct relative ordering)
        batch_size = predictions.size(0)
        ranking_loss = 0.0

        for i in range(batch_size):
            pred_ranks = torch.argsort(predictions[i], descending=True)
            target_ranks = torch.argsort(targets[i], descending=True)

            # Spearman rank correlation as loss
            n = len(pred_ranks)
            d_squared = ((pred_ranks.float() - target_ranks.float()) ** 2).sum()
            spearman_corr = 1 - (6 * d_squared) / (n * (n**2 - 1))
            ranking_loss += 1 - spearman_corr

        ranking_loss = ranking_loss / batch_size

        # Combine losses
        total_loss = mse_loss + 0.1 * ranking_loss

        # Apply confidence weighting if available
        if confidence is not None:
            # High confidence predictions should have lower loss tolerance
            confidence_weights = 1.0 + 0.5 * confidence.squeeze(-1)
            total_loss = total_loss * confidence_weights.mean()

        return total_loss

    def _calculate_confidence_loss(
        self,
        confidence: torch.Tensor,
        predictions: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        """Calculate confidence calibration loss"""

        # Calculate prediction errors
        errors = torch.abs(predictions - targets).mean(dim=-1, keepdim=True)

        # Confidence should be inversely related to error
        # High confidence should correspond to low errors
        target_confidence = 1.0 / (1.0 + errors)

        # Use MSE loss for confidence calibration
        confidence_loss = F.mse_loss(confidence, target_confidence)

        return confidence_loss

    def _calculate_risk_loss(
        self,
        risk_scores: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        """Calculate risk assessment loss"""

        # Calculate realized volatility as proxy for true risk
        target_volatility = torch.std(targets, dim=-1, keepdim=False)

        # Risk scores should predict volatility
        predicted_risk = torch.sum(risk_scores, dim=-1)  # Sum across risk factors

        # Use MSE loss for risk prediction
        risk_loss = F.mse_loss(predicted_risk, target_volatility)

        return risk_loss

    def _calculate_regime_loss(
        self,
        regime_probs: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        """Calculate market regime classification loss"""

        # Infer regime from target characteristics
        # This is a simplified regime inference - in practice, you'd have labeled regimes
        target_mean = torch.mean(targets, dim=-1)
        target_std = torch.std(targets, dim=-1)

        # Simple regime classification based on mean return and volatility
        regime_labels = torch.zeros(
            targets.size(0), dtype=torch.long, device=targets.device
        )

        # Bull market: positive mean, moderate volatility
        bull_mask = (target_mean > 0.001) & (target_std < 0.03)
        regime_labels[bull_mask] = 0

        # Bear market: negative mean, high volatility
        bear_mask = (target_mean < -0.001) & (target_std > 0.02)
        regime_labels[bear_mask] = 1

        # Sideways market: low absolute mean, low volatility
        sideways_mask = ~(bull_mask | bear_mask)
        regime_labels[sideways_mask] = 2

        # Cross-entropy loss for regime classification
        regime_loss = F.cross_entropy(regime_probs, regime_labels)

        return regime_loss

    def _compute_total_loss(
        self,
        model_outputs: Dict[str, torch.Tensor],
        targets: torch.Tensor,
    ) -> Dict[str, torch.Tensor]:
        """Compute weighted total loss"""

        losses = {}

        # Recommendation loss
        rec_loss = self._calculate_recommendation_loss(
            model_outputs["recommendations"], targets, model_outputs.get("confidence")
        )
        losses["recommendation_loss"] = rec_loss

        # Confidence loss
        if "confidence" in model_outputs:
            conf_loss = self._calculate_confidence_loss(
                model_outputs["confidence"], model_outputs["recommendations"], targets
            )
            losses["confidence_loss"] = conf_loss

        # Risk loss
        if "risk_scores" in model_outputs:
            risk_loss = self._calculate_risk_loss(model_outputs["risk_scores"], targets)
            losses["risk_loss"] = risk_loss

        # Regime loss
        if "regime_probs" in model_outputs:
            regime_loss = self._calculate_regime_loss(
                model_outputs["regime_probs"], targets
            )
            losses["regime_loss"] = regime_loss

        # Compute weighted total loss
        total_loss = 0.0
        for loss_name, loss_value in losses.items():
            weight_key = loss_name.replace("_loss", "")
            weight = self.loss_weights.get(weight_key, 1.0)
            total_loss += weight * loss_value

        losses["total_loss"] = total_loss

        return losses

    def training_step(
        self, batch: Dict[str, torch.Tensor], batch_idx: int
    ) -> torch.Tensor:
        """Training step"""

        # Extract inputs and targets
        price_data = batch["price"]
        volume_data = batch["volume"]
        technical_data = batch["technical"]
        fundamental_data = batch["fundamental"]
        targets = batch["target"]

        # Forward pass
        model_outputs = self(price_data, volume_data, technical_data, fundamental_data)

        # Calculate losses
        losses = self._compute_total_loss(model_outputs, targets)

        # Log training losses
        for loss_name, loss_value in losses.items():
            self.log(
                f"train_{loss_name}",
                loss_value,
                on_step=False,
                on_epoch=True,
                prog_bar=(loss_name == "total_loss"),
            )

        # Calculate and log training metrics every N steps
        if batch_idx % 50 == 0:  # Log metrics less frequently for performance
            with torch.no_grad():
                train_metrics = self.metrics_calculator.calculate_all_metrics(
                    model_outputs, targets
                )

                for metric_name, metric_value in train_metrics.items():
                    self.log(
                        f"train_{metric_name}",
                        metric_value,
                        on_step=False,
                        on_epoch=True,
                        prog_bar=False,
                    )

        return losses["total_loss"]

    def validation_step(
        self, batch: Dict[str, torch.Tensor], batch_idx: int
    ) -> Dict[str, torch.Tensor]:
        """Validation step"""

        # Extract inputs and targets
        price_data = batch["price"]
        volume_data = batch["volume"]
        technical_data = batch["technical"]
        fundamental_data = batch["fundamental"]
        targets = batch["target"]

        # Forward pass
        model_outputs = self(price_data, volume_data, technical_data, fundamental_data)

        # Calculate losses
        losses = self._compute_total_loss(model_outputs, targets)

        # Calculate comprehensive metrics
        val_metrics = self.metrics_calculator.calculate_all_metrics(
            model_outputs, targets
        )

        return {
            "val_loss": losses["total_loss"],
            "model_outputs": model_outputs,
            "targets": targets,
            "metrics": val_metrics,
            **losses,
        }

    def validation_epoch_end(self, outputs: List[Dict[str, torch.Tensor]]):
        """Validation epoch end"""

        # Aggregate losses
        avg_val_loss = torch.stack([x["val_loss"] for x in outputs]).mean()
        self.log("val_total_loss", avg_val_loss, prog_bar=True)

        # Aggregate other losses
        for loss_name in [
            "recommendation_loss",
            "confidence_loss",
            "risk_loss",
            "regime_loss",
        ]:
            if loss_name in outputs[0]:
                avg_loss = torch.stack([x[loss_name] for x in outputs]).mean()
                self.log(f"val_{loss_name}", avg_loss)

        # Aggregate metrics across batches
        all_metrics = {}
        metric_keys = list(outputs[0]["metrics"].keys())

        for metric_name in metric_keys:
            metric_values = [batch["metrics"][metric_name] for batch in outputs]
            avg_metric = np.mean(metric_values)
            all_metrics[metric_name] = avg_metric
            self.log(f"val_{metric_name}", avg_metric)

        # Update metrics tracker
        self.val_metrics_tracker.update(self.current_epoch, all_metrics)

        # Check for best model
        if self.monitor_metric.startswith("val_"):
            monitor_key = self.monitor_metric[4:]  # Remove "val_" prefix
        else:
            monitor_key = self.monitor_metric

        if monitor_key in all_metrics:
            current_value = all_metrics[monitor_key]

            if self.mode == "max" and current_value > self.best_metric_value:
                self.best_metric_value = current_value
                logger.info(f"New best {self.monitor_metric}: {current_value:.4f}")
            elif self.mode == "min" and current_value < self.best_metric_value:
                self.best_metric_value = current_value
                logger.info(f"New best {self.monitor_metric}: {current_value:.4f}")

    def test_step(
        self, batch: Dict[str, torch.Tensor], batch_idx: int
    ) -> Dict[str, torch.Tensor]:
        """Test step"""
        return self.validation_step(batch, batch_idx)

    def test_epoch_end(self, outputs: List[Dict[str, torch.Tensor]]):
        """Test epoch end"""

        # Calculate comprehensive test metrics
        all_metrics = {}
        metric_keys = list(outputs[0]["metrics"].keys())

        for metric_name in metric_keys:
            metric_values = [batch["metrics"][metric_name] for batch in outputs]
            avg_metric = np.mean(metric_values)
            all_metrics[metric_name] = avg_metric
            self.log(f"test_{metric_name}", avg_metric)

        logger.info("Test Results:")
        for metric_name, metric_value in all_metrics.items():
            logger.info(f"  {metric_name}: {metric_value:.4f}")

    def configure_optimizers(self) -> Dict[str, Any]:
        """Configure optimizers and learning rate schedulers"""

        # Get model parameters with different learning rates for different components
        transformer_params = []
        head_params = []

        for name, param in self.named_parameters():
            if "recommendation_head" in name:
                head_params.append(param)
            else:
                transformer_params.append(param)

        # Configure optimizer
        if self.optimizer_name.lower() == "adamw":
            optimizer = AdamW(
                [
                    {"params": transformer_params, "lr": self.learning_rate},
                    {
                        "params": head_params,
                        "lr": self.learning_rate * 2,
                    },  # Higher LR for heads
                ],
                weight_decay=self.weight_decay,
            )
        elif self.optimizer_name.lower() == "adam":
            optimizer = Adam(
                [
                    {"params": transformer_params, "lr": self.learning_rate},
                    {"params": head_params, "lr": self.learning_rate * 2},
                ],
                weight_decay=self.weight_decay,
            )
        else:
            raise ValueError(f"Unsupported optimizer: {self.optimizer_name}")

        # Configure scheduler
        scheduler_config = {"optimizer": optimizer}

        if self.scheduler_name.lower() == "reduce_on_plateau":
            scheduler = ReduceLROnPlateau(
                optimizer,
                mode=self.mode,
                factor=self.scheduler_config.get("factor", 0.5),
                patience=self.scheduler_config.get("patience", 5),
                verbose=True,
            )
            scheduler_config.update(
                {
                    "lr_scheduler": scheduler,
                    "monitor": self.monitor_metric,
                    "interval": "epoch",
                    "frequency": 1,
                }
            )

        elif self.scheduler_name.lower() == "cosine":
            max_epochs = self.scheduler_config.get("max_epochs", 100)
            scheduler = CosineAnnealingLR(
                optimizer,
                T_max=max_epochs,
                eta_min=self.scheduler_config.get("eta_min", 1e-6),
            )
            scheduler_config.update(
                {
                    "lr_scheduler": scheduler,
                    "interval": "epoch",
                    "frequency": 1,
                }
            )

        return scheduler_config

    def on_train_epoch_start(self):
        """Called at the start of each training epoch"""
        self.current_epoch_num = self.current_epoch

    def on_train_epoch_end(self):
        """Called at the end of each training epoch"""

        # Apply warmup learning rate scaling
        if self.current_epoch < self.warmup_epochs:
            warmup_factor = (self.current_epoch + 1) / self.warmup_epochs

            for param_group in self.optimizers().param_groups:
                param_group["lr"] = param_group["lr"] * warmup_factor

        logger.info(
            f"Epoch {self.current_epoch} completed. "
            f"Current LR: {self.optimizers().param_groups[0]['lr']:.2e}"
        )

    def get_model_size_info(self) -> Dict[str, Any]:
        """Get model size information"""
        return self.model.get_model_size()

    def save_metrics_history(self, filepath: Union[str, Path]):
        """Save training and validation metrics history"""

        filepath = Path(filepath)

        # Save training metrics
        train_path = filepath.parent / f"{filepath.stem}_train{filepath.suffix}"
        self.train_metrics_tracker.save_metrics(str(train_path))

        # Save validation metrics
        val_path = filepath.parent / f"{filepath.stem}_val{filepath.suffix}"
        self.val_metrics_tracker.save_metrics(str(val_path))

        logger.info(f"Metrics history saved to {filepath.parent}")

    def get_best_metrics(self) -> Dict[str, float]:
        """Get best validation metrics"""
        return self.val_metrics_tracker.best_metrics


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Model configuration
    model_config = {
        "d_model": 256,
        "nhead": 8,
        "num_encoder_layers": 4,
        "num_assets": 50,
        "sequence_length": 30,
        "num_risk_factors": 3,
    }

    # Initialize Lightning module
    lightning_module = FinancialLightningModule(
        model_config=model_config,
        learning_rate=1e-4,
        optimizer="adamw",
        scheduler="reduce_on_plateau",
    )

    print("✅ Lightning module initialized")
    print(f"Model size: {lightning_module.get_model_size_info()}")

    # Test forward pass
    batch_size = 8
    sequence_length = 30

    # Create dummy batch
    dummy_batch = {
        "price": torch.randn(batch_size, sequence_length, 4),
        "volume": torch.randn(batch_size, sequence_length, 1),
        "technical": torch.randn(batch_size, sequence_length, 20),
        "fundamental": torch.randn(batch_size, sequence_length, 15),
        "target": torch.randn(batch_size, model_config["num_assets"]),
    }

    # Test training step
    lightning_module.train()
    loss = lightning_module.training_step(dummy_batch, 0)
    print(f"✅ Training step completed with loss: {loss:.4f}")

    # Test validation step
    lightning_module.eval()
    with torch.no_grad():
        val_output = lightning_module.validation_step(dummy_batch, 0)
        print(f"✅ Validation step completed with loss: {val_output['val_loss']:.4f}")

    print("✅ Financial Lightning module test completed successfully")

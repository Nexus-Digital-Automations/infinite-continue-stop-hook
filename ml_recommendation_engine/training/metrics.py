"""
Financial-specific metrics for evaluating recommendation engine performance

Includes traditional ML metrics as well as financial-specific evaluation metrics
such as Sharpe ratio, maximum drawdown, and risk-adjusted returns.
"""

import torch
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import logging
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    mean_squared_error,
    mean_absolute_error,
)
import warnings

warnings.filterwarnings("ignore", category=RuntimeWarning)

logger = logging.getLogger(__name__)


class FinancialMetrics:
    """
    Comprehensive financial metrics for recommendation engine evaluation

    Includes:
    - Traditional ML metrics (MSE, MAE, accuracy, etc.)
    - Financial performance metrics (Sharpe ratio, max drawdown, etc.)
    - Risk assessment metrics (VaR, volatility, etc.)
    - Recommendation quality metrics (precision@k, NDCG, etc.)
    """

    def __init__(self, risk_free_rate: float = 0.02, trading_cost: float = 0.001):
        """
        Initialize financial metrics calculator

        Args:
            risk_free_rate: Annual risk-free rate for Sharpe ratio calculation
            trading_cost: Trading cost per transaction (fraction of trade value)
        """
        self.risk_free_rate = risk_free_rate
        self.trading_cost = trading_cost

        logger.info(
            f"FinancialMetrics initialized with risk_free_rate={risk_free_rate}, "
            f"trading_cost={trading_cost}"
        )

    def calculate_prediction_metrics(
        self,
        predictions: torch.Tensor,
        targets: torch.Tensor,
        confidence: Optional[torch.Tensor] = None,
    ) -> Dict[str, float]:
        """
        Calculate prediction accuracy metrics

        Args:
            predictions: Model predictions [batch_size, num_assets]
            targets: True targets [batch_size, num_assets]
            confidence: Prediction confidence scores [batch_size, 1]

        Returns:
            Dictionary of prediction metrics
        """

        logger.debug("Calculating prediction metrics")

        metrics = {}

        # Convert to numpy for sklearn compatibility
        pred_np = predictions.detach().cpu().numpy()
        target_np = targets.detach().cpu().numpy()

        # Regression metrics (for continuous predictions)
        try:
            metrics["mse"] = mean_squared_error(target_np.flatten(), pred_np.flatten())
            metrics["mae"] = mean_absolute_error(target_np.flatten(), pred_np.flatten())
            metrics["rmse"] = np.sqrt(metrics["mse"])

            # R-squared
            ss_res = np.sum((target_np.flatten() - pred_np.flatten()) ** 2)
            ss_tot = np.sum((target_np.flatten() - np.mean(target_np.flatten())) ** 2)
            metrics["r2"] = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0.0

        except Exception as e:
            logger.warning(f"Error calculating regression metrics: {e}")
            metrics.update(
                {
                    "mse": float("inf"),
                    "mae": float("inf"),
                    "rmse": float("inf"),
                    "r2": 0.0,
                }
            )

        # Classification metrics (if we binarize predictions)
        try:
            # Convert to binary predictions (above/below median)
            pred_binary = (pred_np > np.median(pred_np, axis=1, keepdims=True)).astype(
                int
            )
            target_binary = (
                target_np > np.median(target_np, axis=1, keepdims=True)
            ).astype(int)

            metrics["accuracy"] = accuracy_score(
                target_binary.flatten(), pred_binary.flatten()
            )
            metrics["precision"] = precision_score(
                target_binary.flatten(),
                pred_binary.flatten(),
                average="weighted",
                zero_division=0,
            )
            metrics["recall"] = recall_score(
                target_binary.flatten(),
                pred_binary.flatten(),
                average="weighted",
                zero_division=0,
            )
            metrics["f1"] = f1_score(
                target_binary.flatten(),
                pred_binary.flatten(),
                average="weighted",
                zero_division=0,
            )

        except Exception as e:
            logger.warning(f"Error calculating classification metrics: {e}")
            metrics.update(
                {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1": 0.0}
            )

        # Confidence-based metrics
        if confidence is not None:
            try:
                conf_np = confidence.detach().cpu().numpy()

                # Correlation between confidence and accuracy
                errors = np.abs(pred_np.flatten() - target_np.flatten())
                confidence_accuracy_corr = np.corrcoef(conf_np.flatten(), -errors)[0, 1]
                metrics["confidence_accuracy_corr"] = (
                    confidence_accuracy_corr
                    if not np.isnan(confidence_accuracy_corr)
                    else 0.0
                )

                # Average confidence
                metrics["avg_confidence"] = np.mean(conf_np)

            except Exception as e:
                logger.warning(f"Error calculating confidence metrics: {e}")
                metrics.update({"confidence_accuracy_corr": 0.0, "avg_confidence": 0.0})

        logger.debug(f"Calculated {len(metrics)} prediction metrics")
        return metrics

    def calculate_financial_performance_metrics(
        self,
        returns: np.ndarray,
        weights: Optional[np.ndarray] = None,
        benchmark_returns: Optional[np.ndarray] = None,
        trading_costs: bool = True,
    ) -> Dict[str, float]:
        """
        Calculate financial performance metrics

        Args:
            returns: Portfolio returns over time [time_steps] or [time_steps, assets]
            weights: Portfolio weights [time_steps, assets] (if None, assumes equal weight)
            benchmark_returns: Benchmark returns for comparison [time_steps]
            trading_costs: Whether to include trading costs in calculations

        Returns:
            Dictionary of financial metrics
        """

        logger.debug("Calculating financial performance metrics")

        metrics = {}

        try:
            # Ensure returns is 1D (portfolio returns)
            if returns.ndim == 2:
                if weights is not None:
                    # Calculate portfolio returns using weights
                    portfolio_returns = np.sum(returns * weights, axis=1)
                else:
                    # Equal weight portfolio
                    portfolio_returns = np.mean(returns, axis=1)
            else:
                portfolio_returns = returns

            # Remove NaN values
            portfolio_returns = portfolio_returns[~np.isnan(portfolio_returns)]

            if len(portfolio_returns) == 0:
                logger.warning("No valid portfolio returns found")
                return {
                    "total_return": 0.0,
                    "annualized_return": 0.0,
                    "volatility": 0.0,
                    "sharpe_ratio": 0.0,
                    "max_drawdown": 0.0,
                    "calmar_ratio": 0.0,
                    "var_95": 0.0,
                    "var_99": 0.0,
                }

            # Apply trading costs if requested and weights are provided
            if trading_costs and weights is not None and len(weights) > 1:
                # Calculate turnover (sum of absolute weight changes)
                weight_changes = np.abs(np.diff(weights, axis=0))
                turnover = np.sum(weight_changes, axis=1)

                # Apply trading costs
                cost_drag = turnover * self.trading_cost
                portfolio_returns[1:] -= cost_drag

            # Basic return metrics
            total_return = np.prod(1 + portfolio_returns) - 1
            annualized_return = (1 + total_return) ** (252 / len(portfolio_returns)) - 1

            metrics["total_return"] = total_return
            metrics["annualized_return"] = annualized_return

            # Volatility metrics
            volatility = np.std(portfolio_returns) * np.sqrt(252)  # Annualized
            metrics["volatility"] = volatility

            # Sharpe ratio
            excess_return = annualized_return - self.risk_free_rate
            sharpe_ratio = excess_return / volatility if volatility != 0 else 0.0
            metrics["sharpe_ratio"] = sharpe_ratio

            # Maximum drawdown
            cumulative_returns = np.cumprod(1 + portfolio_returns)
            running_max = np.maximum.accumulate(cumulative_returns)
            drawdowns = (cumulative_returns - running_max) / running_max
            max_drawdown = np.min(drawdowns)
            metrics["max_drawdown"] = max_drawdown

            # Calmar ratio (annualized return / absolute max drawdown)
            calmar_ratio = (
                annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0.0
            )
            metrics["calmar_ratio"] = calmar_ratio

            # Value at Risk (VaR)
            metrics["var_95"] = np.percentile(portfolio_returns, 5)
            metrics["var_99"] = np.percentile(portfolio_returns, 1)

            # Conditional VaR (Expected Shortfall)
            var_95 = metrics["var_95"]
            cvar_95 = np.mean(portfolio_returns[portfolio_returns <= var_95])
            metrics["cvar_95"] = cvar_95

            # Information ratio (if benchmark provided)
            if benchmark_returns is not None:
                benchmark_returns = benchmark_returns[~np.isnan(benchmark_returns)]
                min_length = min(len(portfolio_returns), len(benchmark_returns))

                if min_length > 1:
                    port_ret = portfolio_returns[:min_length]
                    bench_ret = benchmark_returns[:min_length]

                    excess_returns = port_ret - bench_ret
                    tracking_error = np.std(excess_returns) * np.sqrt(252)

                    if tracking_error != 0:
                        information_ratio = (
                            np.mean(excess_returns) * 252 / tracking_error
                        )
                    else:
                        information_ratio = 0.0

                    metrics["information_ratio"] = information_ratio
                    metrics["tracking_error"] = tracking_error

            # Sortino ratio (downside deviation)
            downside_returns = portfolio_returns[portfolio_returns < 0]
            if len(downside_returns) > 0:
                downside_deviation = np.std(downside_returns) * np.sqrt(252)
                sortino_ratio = (
                    excess_return / downside_deviation
                    if downside_deviation != 0
                    else 0.0
                )
            else:
                sortino_ratio = float("inf") if excess_return > 0 else 0.0

            metrics["sortino_ratio"] = sortino_ratio

        except Exception as e:
            logger.error(f"Error calculating financial performance metrics: {e}")
            # Return default metrics on error
            return {
                "total_return": 0.0,
                "annualized_return": 0.0,
                "volatility": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown": 0.0,
                "calmar_ratio": 0.0,
                "var_95": 0.0,
                "var_99": 0.0,
                "cvar_95": 0.0,
                "sortino_ratio": 0.0,
            }

        logger.debug(f"Calculated {len(metrics)} financial performance metrics")
        return metrics

    def calculate_recommendation_metrics(
        self,
        recommendations: torch.Tensor,
        targets: torch.Tensor,
        k_values: List[int] = [5, 10, 20],
    ) -> Dict[str, float]:
        """
        Calculate recommendation quality metrics

        Args:
            recommendations: Recommendation probabilities [batch_size, num_assets]
            targets: True future performance [batch_size, num_assets]
            k_values: List of k values for precision@k calculation

        Returns:
            Dictionary of recommendation metrics
        """

        logger.debug("Calculating recommendation quality metrics")

        metrics = {}

        try:
            # Convert to numpy
            rec_np = recommendations.detach().cpu().numpy()
            target_np = targets.detach().cpu().numpy()

            batch_size, num_assets = rec_np.shape

            # Calculate precision@k for each k
            for k in k_values:
                if k >= num_assets:
                    continue

                precision_k_scores = []

                for i in range(batch_size):
                    # Get top-k recommendations
                    top_k_indices = np.argsort(rec_np[i])[-k:]

                    # Get top-k actual performers
                    actual_top_k_indices = np.argsort(target_np[i])[-k:]

                    # Calculate intersection
                    intersection = len(set(top_k_indices) & set(actual_top_k_indices))
                    precision_k_scores.append(intersection / k)

                metrics[f"precision_at_{k}"] = np.mean(precision_k_scores)

            # NDCG (Normalized Discounted Cumulative Gain)
            def calculate_dcg(scores, k):
                """Calculate DCG@k"""
                return np.sum(
                    [scores[i] / np.log2(i + 2) for i in range(min(k, len(scores)))]
                )

            ndcg_scores = []
            for i in range(batch_size):
                # Sort by recommendations
                rec_sorted_indices = np.argsort(rec_np[i])[::-1]
                target_scores = target_np[i][rec_sorted_indices]

                # Calculate DCG
                dcg = calculate_dcg(target_scores, min(20, num_assets))

                # Calculate IDCG (ideal DCG)
                ideal_scores = np.sort(target_np[i])[::-1]
                idcg = calculate_dcg(ideal_scores, min(20, num_assets))

                # Calculate NDCG
                ndcg = dcg / idcg if idcg > 0 else 0.0
                ndcg_scores.append(ndcg)

            metrics["ndcg_20"] = np.mean(ndcg_scores)

            # Hit rate (percentage of batches with at least one correct top-k recommendation)
            hit_rates = []
            for k in [5, 10]:
                if k < num_assets:
                    hits = 0
                    for i in range(batch_size):
                        top_k_rec = np.argsort(rec_np[i])[-k:]
                        top_k_actual = np.argsort(target_np[i])[-k:]
                        if len(set(top_k_rec) & set(top_k_actual)) > 0:
                            hits += 1

                    hit_rate = hits / batch_size
                    metrics[f"hit_rate_{k}"] = hit_rate

            # Mean reciprocal rank
            mrr_scores = []
            for i in range(batch_size):
                rec_ranks = np.argsort(np.argsort(rec_np[i]))[::-1] + 1
                target_ranks = np.argsort(np.argsort(target_np[i]))[::-1] + 1

                # Find the rank of the best actual performer in recommendations
                best_actual_asset = np.argmax(target_np[i])
                rank_of_best = rec_ranks[best_actual_asset]

                mrr_scores.append(1.0 / rank_of_best)

            metrics["mrr"] = np.mean(mrr_scores)

        except Exception as e:
            logger.error(f"Error calculating recommendation metrics: {e}")
            # Return default metrics on error
            for k in k_values:
                metrics[f"precision_at_{k}"] = 0.0
            metrics.update(
                {
                    "ndcg_20": 0.0,
                    "hit_rate_5": 0.0,
                    "hit_rate_10": 0.0,
                    "mrr": 0.0,
                }
            )

        logger.debug(f"Calculated {len(metrics)} recommendation metrics")
        return metrics

    def calculate_risk_metrics(
        self,
        risk_scores: torch.Tensor,
        returns: Optional[torch.Tensor] = None,
    ) -> Dict[str, float]:
        """
        Calculate risk assessment metrics

        Args:
            risk_scores: Model risk predictions [batch_size, num_risk_factors]
            returns: Actual returns (if available) [batch_size, num_assets]

        Returns:
            Dictionary of risk metrics
        """

        logger.debug("Calculating risk assessment metrics")

        metrics = {}

        try:
            risk_np = risk_scores.detach().cpu().numpy()

            # Risk score statistics
            metrics["avg_risk_score"] = np.mean(risk_np)
            metrics["risk_score_std"] = np.std(risk_np)
            metrics["risk_score_entropy"] = -np.sum(
                risk_np * np.log(risk_np + 1e-8), axis=1
            ).mean()

            # Risk diversification (how spread out are the risk factors)
            risk_concentration = np.sum(risk_np**2, axis=1).mean()
            metrics["risk_concentration"] = risk_concentration

            # If actual returns are provided, calculate risk-return relationship
            if returns is not None:
                returns_np = returns.detach().cpu().numpy()

                # Calculate realized volatility
                realized_vol = np.std(returns_np, axis=1)

                # Correlation between predicted risk and realized volatility
                if len(realized_vol) > 1 and risk_np.shape[1] > 0:
                    avg_risk_score = np.mean(risk_np, axis=1)
                    risk_vol_corr = np.corrcoef(avg_risk_score, realized_vol)[0, 1]
                    metrics["risk_volatility_correlation"] = (
                        risk_vol_corr if not np.isnan(risk_vol_corr) else 0.0
                    )

        except Exception as e:
            logger.error(f"Error calculating risk metrics: {e}")
            metrics.update(
                {
                    "avg_risk_score": 0.0,
                    "risk_score_std": 0.0,
                    "risk_score_entropy": 0.0,
                    "risk_concentration": 0.0,
                }
            )

        logger.debug(f"Calculated {len(metrics)} risk metrics")
        return metrics

    def calculate_regime_metrics(
        self,
        regime_probs: torch.Tensor,
        true_regimes: Optional[torch.Tensor] = None,
    ) -> Dict[str, float]:
        """
        Calculate market regime detection metrics

        Args:
            regime_probs: Predicted regime probabilities [batch_size, 3] (Bull, Bear, Sideways)
            true_regimes: True regime labels [batch_size] (if available)

        Returns:
            Dictionary of regime detection metrics
        """

        logger.debug("Calculating regime detection metrics")

        metrics = {}

        try:
            regime_np = regime_probs.detach().cpu().numpy()

            # Regime prediction confidence
            regime_predictions = np.argmax(regime_np, axis=1)
            regime_confidence = np.max(regime_np, axis=1)

            metrics["avg_regime_confidence"] = np.mean(regime_confidence)
            metrics["regime_entropy"] = -np.sum(
                regime_np * np.log(regime_np + 1e-8), axis=1
            ).mean()

            # Regime distribution
            unique_regimes, counts = np.unique(regime_predictions, return_counts=True)
            regime_distribution = counts / len(regime_predictions)

            for i, regime in enumerate(unique_regimes):
                regime_names = ["bull", "bear", "sideways"]
                if regime < len(regime_names):
                    metrics[f"regime_{regime_names[regime]}_ratio"] = (
                        regime_distribution[i]
                    )

            # If true regimes are provided, calculate accuracy
            if true_regimes is not None:
                true_regime_np = true_regimes.detach().cpu().numpy()
                regime_accuracy = accuracy_score(true_regime_np, regime_predictions)
                metrics["regime_accuracy"] = regime_accuracy

                # Regime-specific precision and recall
                for i, regime_name in enumerate(["bull", "bear", "sideways"]):
                    true_regime_mask = true_regime_np == i
                    pred_regime_mask = regime_predictions == i

                    if np.sum(pred_regime_mask) > 0:
                        precision = np.sum(
                            true_regime_mask & pred_regime_mask
                        ) / np.sum(pred_regime_mask)
                        metrics[f"regime_{regime_name}_precision"] = precision

                    if np.sum(true_regime_mask) > 0:
                        recall = np.sum(true_regime_mask & pred_regime_mask) / np.sum(
                            true_regime_mask
                        )
                        metrics[f"regime_{regime_name}_recall"] = recall

        except Exception as e:
            logger.error(f"Error calculating regime metrics: {e}")
            metrics.update(
                {
                    "avg_regime_confidence": 0.0,
                    "regime_entropy": 0.0,
                    "regime_bull_ratio": 0.33,
                    "regime_bear_ratio": 0.33,
                    "regime_sideways_ratio": 0.33,
                }
            )

        logger.debug(f"Calculated {len(metrics)} regime detection metrics")
        return metrics

    def calculate_all_metrics(
        self,
        model_outputs: Dict[str, torch.Tensor],
        targets: torch.Tensor,
        returns: Optional[np.ndarray] = None,
        weights: Optional[np.ndarray] = None,
        true_regimes: Optional[torch.Tensor] = None,
    ) -> Dict[str, float]:
        """
        Calculate all metrics given model outputs and targets

        Args:
            model_outputs: Dictionary of model outputs including:
                - recommendations: [batch_size, num_assets]
                - confidence: [batch_size, 1]
                - risk_scores: [batch_size, num_risk_factors]
                - regime_probs: [batch_size, 3]
            targets: True targets [batch_size, num_assets]
            returns: Historical returns for financial metrics
            weights: Portfolio weights for financial metrics
            true_regimes: True regime labels (if available)

        Returns:
            Dictionary containing all calculated metrics
        """

        logger.info("Calculating comprehensive metrics suite")

        all_metrics = {}

        # Prediction metrics
        if "recommendations" in model_outputs:
            pred_metrics = self.calculate_prediction_metrics(
                model_outputs["recommendations"],
                targets,
                model_outputs.get("confidence"),
            )
            all_metrics.update(pred_metrics)

        # Financial performance metrics
        if returns is not None:
            financial_metrics = self.calculate_financial_performance_metrics(
                returns, weights
            )
            all_metrics.update(financial_metrics)

        # Recommendation quality metrics
        if "recommendations" in model_outputs:
            rec_metrics = self.calculate_recommendation_metrics(
                model_outputs["recommendations"], targets
            )
            all_metrics.update(rec_metrics)

        # Risk assessment metrics
        if "risk_scores" in model_outputs:
            risk_metrics = self.calculate_risk_metrics(
                model_outputs["risk_scores"],
                targets if len(targets.shape) > 1 else None,
            )
            all_metrics.update(risk_metrics)

        # Regime detection metrics
        if "regime_probs" in model_outputs:
            regime_metrics = self.calculate_regime_metrics(
                model_outputs["regime_probs"], true_regimes
            )
            all_metrics.update(regime_metrics)

        logger.info(f"Calculated {len(all_metrics)} total metrics")
        return all_metrics


# Utility functions for metric tracking
class MetricsTracker:
    """Track metrics over training epochs"""

    def __init__(self):
        self.epoch_metrics = []
        self.best_metrics = {}
        self.best_epoch = 0

        logger.info("MetricsTracker initialized")

    def update(self, epoch: int, metrics: Dict[str, float]):
        """Update metrics for current epoch"""
        self.epoch_metrics.append({"epoch": epoch, **metrics})

        # Update best metrics (using validation Sharpe ratio as primary metric)
        primary_metric = metrics.get("sharpe_ratio", metrics.get("f1", 0.0))

        if not self.best_metrics or primary_metric > self.best_metrics.get(
            "sharpe_ratio", float("-inf")
        ):
            self.best_metrics = metrics.copy()
            self.best_epoch = epoch

            logger.info(
                f"New best metrics at epoch {epoch}: primary_metric={primary_metric:.4f}"
            )

    def get_metrics_dataframe(self) -> pd.DataFrame:
        """Get metrics as pandas DataFrame"""
        return pd.DataFrame(self.epoch_metrics)

    def save_metrics(self, filepath: str):
        """Save metrics to CSV file"""
        df = self.get_metrics_dataframe()
        df.to_csv(filepath, index=False)
        logger.info(f"Metrics saved to {filepath}")


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Test metrics calculation
    metrics_calculator = FinancialMetrics()

    # Generate dummy data
    batch_size = 16
    num_assets = 100
    sequence_length = 60

    # Mock model outputs
    model_outputs = {
        "recommendations": torch.randn(batch_size, num_assets).softmax(dim=-1),
        "confidence": torch.sigmoid(torch.randn(batch_size, 1)),
        "risk_scores": torch.randn(batch_size, 5).softmax(dim=-1),
        "regime_probs": torch.randn(batch_size, 3).softmax(dim=-1),
    }

    targets = torch.randn(batch_size, num_assets)

    # Mock financial data
    returns = np.random.normal(
        0.001, 0.02, (252, num_assets)
    )  # Daily returns for 1 year
    weights = np.random.dirichlet(np.ones(num_assets), 252)  # Random portfolio weights

    # Calculate all metrics
    all_metrics = metrics_calculator.calculate_all_metrics(
        model_outputs, targets, returns, weights
    )

    print("✅ Calculated metrics:")
    for metric, value in all_metrics.items():
        print(f"  {metric}: {value:.4f}")

    # Test metrics tracker
    tracker = MetricsTracker()

    # Simulate training epochs
    for epoch in range(5):
        epoch_metrics = {
            k: v + np.random.normal(0, 0.01) for k, v in all_metrics.items()
        }
        tracker.update(epoch, epoch_metrics)

    print(f"✅ Best metrics at epoch {tracker.best_epoch}")
    print("✅ Financial metrics test completed successfully")

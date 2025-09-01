"""
Financial Data Preprocessing Pipeline

Comprehensive data preprocessing for financial time-series data including:
- Price and volume normalization
- Technical indicator calculation
- Fundamental ratio processing
- Feature engineering and scaling
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Tuple
from sklearn.preprocessing import StandardScaler, RobustScaler, MinMaxScaler
from sklearn.impute import KNNImputer
import ta  # Technical Analysis library
from scipy import stats
import warnings

warnings.filterwarnings("ignore", category=RuntimeWarning)

logger = logging.getLogger(__name__)


class FinancialDataPreprocessor:
    """
    Comprehensive financial data preprocessor with robust handling
    of financial time-series data characteristics
    """

    def __init__(
        self,
        price_scaler_type="robust",
        volume_scaler_type="standard",
        ratio_scaler_type="standard",
        imputation_strategy="knn",
        n_neighbors=5,
    ):
        """
        Initialize preprocessor with configurable scaling strategies

        Args:
            price_scaler_type: 'robust', 'standard', or 'minmax'
            volume_scaler_type: 'robust', 'standard', or 'minmax'
            ratio_scaler_type: 'robust', 'standard', or 'minmax'
            imputation_strategy: 'knn', 'median', 'mean'
            n_neighbors: Number of neighbors for KNN imputation
        """

        self.scalers = {}
        self.imputers = {}

        # Initialize scalers
        scaler_map = {
            "robust": RobustScaler(),
            "standard": StandardScaler(),
            "minmax": MinMaxScaler(),
        }

        self.scalers["price"] = scaler_map[price_scaler_type]
        self.scalers["volume"] = scaler_map[volume_scaler_type]
        self.scalers["ratio"] = scaler_map[ratio_scaler_type]

        # Initialize imputers
        if imputation_strategy == "knn":
            self.imputer = KNNImputer(n_neighbors=n_neighbors)
        else:
            from sklearn.impute import SimpleImputer

            self.imputer = SimpleImputer(strategy=imputation_strategy)

        logger.info(
            f"FinancialDataPreprocessor initialized with "
            f"price_scaler={price_scaler_type}, "
            f"volume_scaler={volume_scaler_type}, "
            f"imputation={imputation_strategy}"
        )

    def preprocess_price_data(self, price_data: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Process price data with log transforms and return calculations

        Args:
            price_data: DataFrame with columns ['open', 'high', 'low', 'close']

        Returns:
            Dictionary containing processed price features
        """

        logger.debug(f"Processing price data with shape {price_data.shape}")

        processed_data = {}

        # Handle missing values first
        price_data_clean = price_data.fillna(method="ffill").fillna(method="bfill")

        # Log transform for prices (handle exponential growth)
        for col in price_data_clean.columns:
            log_prices = np.log(price_data_clean[col] + 1e-8)
            processed_data[f"{col}_log"] = log_prices.values

        # Calculate returns
        for col in price_data_clean.columns:
            returns = price_data_clean[col].pct_change()
            # Handle extreme outliers (more than 3 standard deviations)
            returns = np.clip(returns, returns.quantile(0.001), returns.quantile(0.999))
            processed_data[f"{col}_returns"] = returns.values

        # Calculate volatility (rolling standard deviation)
        for col in price_data_clean.columns:
            volatility = price_data_clean[col].pct_change().rolling(20).std()
            processed_data[f"{col}_volatility"] = volatility.values

        # Scale the features
        for key, values in processed_data.items():
            # Remove NaN values for scaling
            valid_mask = ~np.isnan(values)
            if np.sum(valid_mask) > 0:
                values_clean = values[valid_mask].reshape(-1, 1)
                scaled_values = self.scalers["price"].fit_transform(values_clean)
                processed_data[key] = np.full_like(values, np.nan)
                processed_data[key][valid_mask] = scaled_values.flatten()

        logger.debug(f"Processed {len(processed_data)} price features")
        return processed_data

    def preprocess_volume_data(self, volume_data: pd.Series) -> Dict[str, np.ndarray]:
        """
        Process volume data with proper scaling and outlier handling

        Args:
            volume_data: Series containing volume data

        Returns:
            Dictionary containing processed volume features
        """

        logger.debug(f"Processing volume data with length {len(volume_data)}")

        processed_data = {}

        # Handle missing values
        volume_clean = volume_data.fillna(volume_data.median())

        # Raw volume (log-scaled to handle high variance)
        log_volume = np.log(volume_clean + 1)
        processed_data["volume_log"] = log_volume.values

        # Volume moving averages
        volume_sma_5 = volume_clean.rolling(5).mean()
        volume_sma_20 = volume_clean.rolling(20).mean()

        # Volume ratios (relative volume)
        volume_ratio_5 = volume_clean / volume_sma_5
        volume_ratio_20 = volume_clean / volume_sma_20

        processed_data["volume_ratio_5"] = volume_ratio_5.values
        processed_data["volume_ratio_20"] = volume_ratio_20.values

        # Volume percentile (where current volume ranks historically)
        volume_percentile = volume_clean.rolling(252).apply(
            lambda x: stats.percentileofscore(x, x.iloc[-1]) / 100
        )
        processed_data["volume_percentile"] = volume_percentile.values

        # Scale volume features
        for key, values in processed_data.items():
            valid_mask = ~np.isnan(values)
            if np.sum(valid_mask) > 0:
                values_clean = values[valid_mask].reshape(-1, 1)
                scaled_values = self.scalers["volume"].fit_transform(values_clean)
                processed_data[key] = np.full_like(values, np.nan)
                processed_data[key][valid_mask] = scaled_values.flatten()

        logger.debug(f"Processed {len(processed_data)} volume features")
        return processed_data

    def preprocess_fundamental_data(
        self, fundamental_data: pd.DataFrame
    ) -> Dict[str, np.ndarray]:
        """
        Process fundamental ratios and financial metrics

        Args:
            fundamental_data: DataFrame with fundamental ratios

        Returns:
            Dictionary containing processed fundamental features
        """

        logger.debug(f"Processing fundamental data with shape {fundamental_data.shape}")

        # Handle missing values with imputation
        imputed_data = pd.DataFrame(
            self.imputer.fit_transform(fundamental_data),
            columns=fundamental_data.columns,
            index=fundamental_data.index,
        )

        processed_data = {}

        # Process each ratio with appropriate scaling
        for col in imputed_data.columns:
            values = imputed_data[col].values

            # Handle extreme outliers (cap at 99th percentile)
            q99 = np.percentile(values[~np.isnan(values)], 99)
            q01 = np.percentile(values[~np.isnan(values)], 1)
            values = np.clip(values, q01, q99)

            # Scale the values
            values_scaled = self.scalers["ratio"].fit_transform(values.reshape(-1, 1))
            processed_data[col] = values_scaled.flatten()

            # Add trend features (change over time)
            if len(values) > 4:  # Need at least 5 points for quarterly trend
                trend = np.gradient(values)
                trend_scaled = self.scalers["ratio"].fit_transform(trend.reshape(-1, 1))
                processed_data[f"{col}_trend"] = trend_scaled.flatten()

        logger.debug(f"Processed {len(processed_data)} fundamental features")
        return processed_data

    def create_sequences(
        self,
        data: np.ndarray,
        sequence_length: int = 60,
        prediction_horizon: int = 1,
        stride: int = 1,
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for time-series modeling with configurable stride

        Args:
            data: Input data array
            sequence_length: Length of input sequences
            prediction_horizon: Number of steps to predict
            stride: Step size between sequences

        Returns:
            Tuple of (input_sequences, target_sequences)
        """

        logger.debug(
            f"Creating sequences with length={sequence_length}, "
            f"horizon={prediction_horizon}, stride={stride}"
        )

        if len(data) < sequence_length + prediction_horizon:
            raise ValueError(
                f"Data length {len(data)} too short for "
                f"sequence_length={sequence_length} + "
                f"prediction_horizon={prediction_horizon}"
            )

        X, y = [], []

        for i in range(0, len(data) - sequence_length - prediction_horizon + 1, stride):
            X.append(data[i : i + sequence_length])
            y.append(
                data[i + sequence_length : i + sequence_length + prediction_horizon]
            )

        X = np.array(X)
        y = np.array(y)

        logger.debug(f"Created {len(X)} sequences with shapes X={X.shape}, y={y.shape}")
        return X, y

    def handle_regime_changes(
        self, data: pd.Series, window_size: int = 252
    ) -> np.ndarray:
        """
        Detect market regime changes using volatility and trend analysis

        Args:
            data: Time series data (typically returns or prices)
            window_size: Window size for regime detection

        Returns:
            Array of regime indicators (0=low_vol, 1=normal, 2=high_vol)
        """

        logger.debug(f"Detecting regime changes with window_size={window_size}")

        # Calculate rolling volatility
        rolling_vol = data.rolling(window_size).std()

        # Calculate rolling mean for trend detection
        rolling_mean = data.rolling(window_size).mean()

        # Define regime thresholds based on percentiles
        vol_low = rolling_vol.quantile(0.33)
        vol_high = rolling_vol.quantile(0.67)

        mean_low = rolling_mean.quantile(0.33)
        mean_high = rolling_mean.quantile(0.67)

        # Create regime indicators
        regime_indicators = np.zeros(len(data))

        for i in range(len(data)):
            if i < window_size:
                regime_indicators[i] = 1  # Default to normal regime
                continue

            vol = rolling_vol.iloc[i]
            trend = rolling_mean.iloc[i]

            # Combine volatility and trend information
            if vol < vol_low and abs(trend) < abs(mean_low):
                regime_indicators[i] = 0  # Low volatility, sideways
            elif vol > vol_high:
                regime_indicators[i] = 2  # High volatility
            else:
                regime_indicators[i] = 1  # Normal regime

        logger.debug(
            f"Detected regimes: "
            f"low_vol={np.sum(regime_indicators == 0)}, "
            f"normal={np.sum(regime_indicators == 1)}, "
            f"high_vol={np.sum(regime_indicators == 2)}"
        )

        return regime_indicators

    def save_preprocessing_state(self, filepath: str):
        """Save preprocessor state for consistent inference"""
        import joblib

        state = {"scalers": self.scalers, "imputers": self.imputer}

        joblib.dump(state, filepath)
        logger.info(f"Preprocessing state saved to {filepath}")

    def load_preprocessing_state(self, filepath: str):
        """Load preprocessor state"""
        import joblib

        state = joblib.load(filepath)
        self.scalers = state["scalers"]
        self.imputer = state["imputers"]

        logger.info(f"Preprocessing state loaded from {filepath}")


class FinancialFeatureEngineer:
    """
    Advanced feature engineering for financial time-series data
    """

    def __init__(self):
        self.technical_indicators = []
        logger.info("FinancialFeatureEngineer initialized")

    def create_technical_features(
        self, price_data: pd.DataFrame, volume_data: pd.Series
    ) -> pd.DataFrame:
        """
        Create comprehensive technical indicators

        Args:
            price_data: DataFrame with OHLC data
            volume_data: Series with volume data

        Returns:
            DataFrame with technical indicators
        """

        logger.debug("Creating technical indicators")

        df = price_data.copy()
        df["volume"] = volume_data

        features = pd.DataFrame(index=df.index)

        # Price-based indicators
        features["sma_5"] = ta.trend.sma_indicator(df["close"], window=5)
        features["sma_10"] = ta.trend.sma_indicator(df["close"], window=10)
        features["sma_20"] = ta.trend.sma_indicator(df["close"], window=20)
        features["sma_50"] = ta.trend.sma_indicator(df["close"], window=50)

        features["ema_12"] = ta.trend.ema_indicator(df["close"], window=12)
        features["ema_26"] = ta.trend.ema_indicator(df["close"], window=26)

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(df["close"])
        features["bb_upper"] = bb.bollinger_hband()
        features["bb_lower"] = bb.bollinger_lband()
        features["bb_middle"] = bb.bollinger_mavg()
        features["bb_width"] = features["bb_upper"] - features["bb_lower"]
        features["bb_position"] = (df["close"] - features["bb_lower"]) / features[
            "bb_width"
        ]

        # Volatility indicators
        features["atr"] = ta.volatility.average_true_range(
            df["high"], df["low"], df["close"]
        )

        # Momentum indicators
        features["rsi"] = ta.momentum.rsi(df["close"], window=14)
        features["stoch_k"] = ta.momentum.stoch(df["high"], df["low"], df["close"])
        features["stoch_d"] = ta.momentum.stoch_signal(
            df["high"], df["low"], df["close"]
        )
        features["williams_r"] = ta.momentum.williams_r(
            df["high"], df["low"], df["close"]
        )

        # MACD
        macd = ta.trend.MACD(df["close"])
        features["macd"] = macd.macd()
        features["macd_signal"] = macd.macd_signal()
        features["macd_histogram"] = macd.macd_diff()

        # Volume indicators
        features["volume_sma"] = ta.volume.volume_sma(df["close"], df["volume"])
        features["obv"] = ta.volume.on_balance_volume(df["close"], df["volume"])
        features["cmf"] = ta.volume.chaikin_money_flow(
            df["high"], df["low"], df["close"], df["volume"]
        )

        # Trend indicators
        features["adx"] = ta.trend.adx(df["high"], df["low"], df["close"])
        features["cci"] = ta.trend.cci(df["high"], df["low"], df["close"])

        logger.debug(f"Created {len(features.columns)} technical indicators")

        return features

    def create_fundamental_features(
        self, fundamental_data: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create fundamental analysis features and ratios

        Args:
            fundamental_data: DataFrame with financial statement data

        Returns:
            DataFrame with calculated fundamental ratios
        """

        logger.debug("Creating fundamental features")

        features = pd.DataFrame(index=fundamental_data.index)

        # Valuation ratios
        if all(col in fundamental_data.columns for col in ["market_cap", "earnings"]):
            features["pe_ratio"] = (
                fundamental_data["market_cap"] / fundamental_data["earnings"]
            )

        if all(col in fundamental_data.columns for col in ["market_cap", "book_value"]):
            features["pb_ratio"] = (
                fundamental_data["market_cap"] / fundamental_data["book_value"]
            )

        if all(col in fundamental_data.columns for col in ["market_cap", "sales"]):
            features["ps_ratio"] = (
                fundamental_data["market_cap"] / fundamental_data["sales"]
            )

        # Profitability ratios
        if all(col in fundamental_data.columns for col in ["net_income", "equity"]):
            features["roe"] = (
                fundamental_data["net_income"] / fundamental_data["equity"]
            )

        if all(col in fundamental_data.columns for col in ["net_income", "assets"]):
            features["roa"] = (
                fundamental_data["net_income"] / fundamental_data["assets"]
            )

        if all(col in fundamental_data.columns for col in ["net_income", "revenue"]):
            features["profit_margin"] = (
                fundamental_data["net_income"] / fundamental_data["revenue"]
            )

        # Liquidity ratios
        if all(
            col in fundamental_data.columns
            for col in ["current_assets", "current_liabilities"]
        ):
            features["current_ratio"] = (
                fundamental_data["current_assets"]
                / fundamental_data["current_liabilities"]
            )

        # Leverage ratios
        if all(col in fundamental_data.columns for col in ["debt", "equity"]):
            features["debt_to_equity"] = (
                fundamental_data["debt"] / fundamental_data["equity"]
            )

        # Growth rates (year-over-year)
        for col in fundamental_data.columns:
            if col in ["revenue", "earnings", "book_value"]:
                yoy_growth = fundamental_data[col].pct_change(
                    periods=4
                )  # Quarterly data
                features[f"{col}_growth"] = yoy_growth

        logger.debug(f"Created {len(features.columns)} fundamental features")

        return features

    def create_market_microstructure_features(
        self, price_data: pd.DataFrame, volume_data: pd.Series
    ) -> pd.DataFrame:
        """
        Create market microstructure features (bid-ask spreads, trade intensity, etc.)

        Args:
            price_data: DataFrame with OHLC data
            volume_data: Series with volume data

        Returns:
            DataFrame with microstructure features
        """

        logger.debug("Creating market microstructure features")

        features = pd.DataFrame(index=price_data.index)

        # Price impact measures
        features["high_low_spread"] = (
            price_data["high"] - price_data["low"]
        ) / price_data["close"]
        features["open_close_gap"] = (
            price_data["open"] - price_data["close"].shift(1)
        ) / price_data["close"].shift(1)

        # Volume-price relationships
        features["vwap"] = (price_data["close"] * volume_data).rolling(
            20
        ).sum() / volume_data.rolling(20).sum()
        features["price_volume_trend"] = (
            (
                (price_data["close"] - price_data["close"].shift(1))
                / price_data["close"].shift(1)
                * volume_data
            )
            .rolling(10)
            .mean()
        )

        # Trade intensity measures
        features["volume_volatility"] = (
            volume_data.rolling(20).std() / volume_data.rolling(20).mean()
        )
        features["volume_trend"] = (
            volume_data.rolling(5).mean() / volume_data.rolling(20).mean()
        )

        # Intraday patterns (if applicable)
        if "high" in price_data.columns and "low" in price_data.columns:
            features["intraday_return"] = (
                price_data["close"] - price_data["open"]
            ) / price_data["open"]
            features["overnight_return"] = (
                price_data["open"] - price_data["close"].shift(1)
            ) / price_data["close"].shift(1)

        logger.debug(f"Created {len(features.columns)} microstructure features")

        return features

    def create_cross_asset_features(
        self, multiple_assets_data: Dict[str, pd.DataFrame]
    ) -> pd.DataFrame:
        """
        Create cross-asset features (correlations, relative strength, etc.)

        Args:
            multiple_assets_data: Dictionary of asset_name -> price_data DataFrames

        Returns:
            DataFrame with cross-asset features
        """

        logger.debug("Creating cross-asset features")

        # Combine all asset returns
        returns_data = {}
        for asset_name, price_data in multiple_assets_data.items():
            returns_data[asset_name] = price_data["close"].pct_change()

        returns_df = pd.DataFrame(returns_data)

        features = pd.DataFrame(index=returns_df.index)

        # Rolling correlations with market (assume first asset is market benchmark)
        if len(returns_df.columns) > 1:
            market_returns = returns_df.iloc[:, 0]  # First asset as benchmark

            for asset_name in returns_df.columns[1:]:
                asset_returns = returns_df[asset_name]

                # Rolling correlation with market
                rolling_corr = asset_returns.rolling(60).corr(market_returns)
                features[f"{asset_name}_market_corr"] = rolling_corr

                # Beta (relative volatility)
                rolling_beta = (
                    asset_returns.rolling(60).cov(market_returns)
                    / market_returns.rolling(60).var()
                )
                features[f"{asset_name}_beta"] = rolling_beta

                # Relative strength
                cum_asset_return = (1 + asset_returns).cumprod()
                cum_market_return = (1 + market_returns).cumprod()
                features[f"{asset_name}_relative_strength"] = (
                    cum_asset_return / cum_market_return
                )

        logger.debug(f"Created {len(features.columns)} cross-asset features")

        return features


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Create sample data
    dates = pd.date_range("2020-01-01", "2023-01-01", freq="D")
    n_days = len(dates)

    # Generate synthetic price data
    np.random.seed(42)
    price_data = pd.DataFrame(
        {
            "open": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "high": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "low": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "close": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
        },
        index=dates,
    )

    # Ensure OHLC relationships
    for i in range(len(price_data)):
        ohlc = [
            price_data.loc[price_data.index[i], col]
            for col in ["open", "high", "low", "close"]
        ]
        price_data.loc[price_data.index[i], "high"] = max(ohlc)
        price_data.loc[price_data.index[i], "low"] = min(ohlc)

    volume_data = pd.Series(np.random.lognormal(10, 1, n_days), index=dates)

    # Test preprocessor
    preprocessor = FinancialDataPreprocessor()

    # Test price preprocessing
    price_features = preprocessor.preprocess_price_data(price_data)
    print(f"✅ Created {len(price_features)} price features")

    # Test volume preprocessing
    volume_features = preprocessor.preprocess_volume_data(volume_data)
    print(f"✅ Created {len(volume_features)} volume features")

    # Test feature engineer
    feature_engineer = FinancialFeatureEngineer()

    # Test technical features
    tech_features = feature_engineer.create_technical_features(price_data, volume_data)
    print(f"✅ Created {len(tech_features.columns)} technical features")

    # Test sequence creation
    sample_data = price_data["close"].pct_change().dropna().values
    X, y = preprocessor.create_sequences(
        sample_data, sequence_length=60, prediction_horizon=1
    )
    print(f"✅ Created sequences: X.shape={X.shape}, y.shape={y.shape}")

    # Test regime detection
    regime_indicators = preprocessor.handle_regime_changes(
        price_data["close"].pct_change().dropna()
    )
    print(f"✅ Detected regimes: {np.unique(regime_indicators, return_counts=True)}")

    print("✅ Financial data preprocessing test completed successfully")

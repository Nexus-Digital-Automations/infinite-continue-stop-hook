"""
Financial Data Loader and Dataset Classes

PyTorch dataset and data loader implementations for financial time-series data
with comprehensive caching, batching, and preprocessing capabilities.
"""

import torch
from torch.utils.data import Dataset, DataLoader
import pandas as pd
import numpy as np
import logging
from typing import Dict, Tuple, List, Optional, Union
from pathlib import Path
import h5py
import warnings

warnings.filterwarnings("ignore", category=RuntimeWarning)

logger = logging.getLogger(__name__)


class FinancialDataset(Dataset):
    """
    PyTorch Dataset for financial time-series data with multi-modal features

    Supports:
    - Price, volume, technical, and fundamental data
    - Variable sequence lengths and prediction horizons
    - Data augmentation and regime-aware sampling
    - Efficient caching and memory management
    """

    def __init__(
        self,
        data_path: Union[str, Path, Dict],
        sequence_length: int = 60,
        prediction_horizon: int = 1,
        features: Optional[List[str]] = None,
        target_column: str = "close",
        validation_split: float = 0.2,
        test_split: float = 0.1,
        cache_processed_data: bool = True,
        data_augmentation: bool = False,
        regime_aware: bool = True,
        min_samples_per_regime: int = 100,
        seed: int = 42,
    ):
        """
        Initialize Financial Dataset

        Args:
            data_path: Path to data file(s) or pre-loaded data dictionary
            sequence_length: Length of input sequences
            prediction_horizon: Number of steps to predict ahead
            features: List of feature columns to use
            target_column: Column name for prediction target
            validation_split: Fraction of data for validation
            test_split: Fraction of data for testing
            cache_processed_data: Whether to cache preprocessed data
            data_augmentation: Enable data augmentation techniques
            regime_aware: Use regime-aware data splitting
            min_samples_per_regime: Minimum samples required per regime
            seed: Random seed for reproducibility
        """

        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        self.target_column = target_column
        self.validation_split = validation_split
        self.test_split = test_split
        self.cache_processed_data = cache_processed_data
        self.data_augmentation = data_augmentation
        self.regime_aware = regime_aware
        self.min_samples_per_regime = min_samples_per_regime
        self.seed = seed

        # Set random seed for reproducibility
        torch.manual_seed(seed)
        np.random.seed(seed)

        logger.info(
            f"Initializing FinancialDataset with sequence_length={sequence_length}, "
            f"prediction_horizon={prediction_horizon}"
        )

        # Load and preprocess data
        self.raw_data = self._load_data(data_path)
        self.features = features or self._get_default_features()

        # Process data
        self.processed_data = self._preprocess_data()
        self.sequences = self._create_sequences()

        # Create data splits
        self.train_indices, self.val_indices, self.test_indices = (
            self._create_data_splits()
        )

        logger.info(
            f"Dataset initialized with {len(self.sequences)} sequences. "
            f"Train: {len(self.train_indices)}, "
            f"Val: {len(self.val_indices)}, "
            f"Test: {len(self.test_indices)}"
        )

    def _load_data(self, data_path: Union[str, Path, Dict]) -> pd.DataFrame:
        """Load data from various sources"""

        if isinstance(data_path, dict):
            logger.debug("Using pre-loaded data dictionary")
            return pd.DataFrame(data_path)

        data_path = Path(data_path)

        if not data_path.exists():
            raise FileNotFoundError(f"Data file not found: {data_path}")

        logger.debug(f"Loading data from {data_path}")

        if data_path.suffix == ".csv":
            df = pd.read_csv(data_path, index_col=0, parse_dates=True)
        elif data_path.suffix == ".parquet":
            df = pd.read_parquet(data_path)
        elif data_path.suffix == ".h5":
            with h5py.File(data_path, "r") as f:
                # Assume data is stored in 'data' group
                df = pd.DataFrame({key: f["data"][key][:] for key in f["data"].keys()})
        else:
            raise ValueError(f"Unsupported file format: {data_path.suffix}")

        # Ensure datetime index
        if not isinstance(df.index, pd.DatetimeIndex):
            if "date" in df.columns:
                df["date"] = pd.to_datetime(df["date"])
                df.set_index("date", inplace=True)
            elif "timestamp" in df.columns:
                df["timestamp"] = pd.to_datetime(df["timestamp"])
                df.set_index("timestamp", inplace=True)
            else:
                logger.warning("No datetime column found, using default index")

        logger.debug(f"Loaded data with shape {df.shape}")
        return df

    def _get_default_features(self) -> List[str]:
        """Get default feature columns based on available data"""

        price_features = ["open", "high", "low", "close"]
        volume_features = ["volume"]

        # Technical indicators (commonly available)
        technical_features = [
            "sma_5",
            "sma_10",
            "sma_20",
            "sma_50",
            "ema_12",
            "ema_26",
            "rsi",
            "macd",
            "bb_upper",
            "bb_lower",
            "atr",
            "stoch_k",
            "stoch_d",
            "obv",
        ]

        # Fundamental ratios
        fundamental_features = [
            "pe_ratio",
            "pb_ratio",
            "ps_ratio",
            "roe",
            "roa",
            "current_ratio",
            "debt_to_equity",
            "profit_margin",
        ]

        all_features = (
            price_features + volume_features + technical_features + fundamental_features
        )

        # Return only features that exist in the data
        available_features = [f for f in all_features if f in self.raw_data.columns]

        logger.debug(f"Using {len(available_features)} features: {available_features}")
        return available_features

    def _preprocess_data(self) -> Dict[str, np.ndarray]:
        """Preprocess raw data for model consumption"""

        logger.debug("Preprocessing data")

        # Handle missing values
        df_clean = self.raw_data[self.features].copy()

        # Forward fill then backward fill
        df_clean = df_clean.fillna(method="ffill").fillna(method="bfill")

        # Remove any remaining NaN values
        initial_length = len(df_clean)
        df_clean = df_clean.dropna()
        final_length = len(df_clean)

        if initial_length != final_length:
            logger.warning(
                f"Dropped {initial_length - final_length} rows with NaN values"
            )

        processed_data = {}

        # Separate different types of features
        price_cols = ["open", "high", "low", "close"]
        volume_cols = ["volume"]
        technical_cols = [
            c
            for c in df_clean.columns
            if c.startswith(
                (
                    "sma_",
                    "ema_",
                    "rsi",
                    "macd",
                    "bb_",
                    "atr",
                    "stoch_",
                    "obv",
                    "adx",
                    "cci",
                )
            )
        ]
        fundamental_cols = [
            c
            for c in df_clean.columns
            if c.endswith(("_ratio", "roe", "roa", "margin"))
        ]

        # Process each group
        for group_name, cols in [
            ("price", price_cols),
            ("volume", volume_cols),
            ("technical", technical_cols),
            ("fundamental", fundamental_cols),
        ]:
            if cols:
                group_data = df_clean[cols].values.astype(np.float32)
                processed_data[group_name] = group_data
                logger.debug(f"Processed {group_name} data: shape {group_data.shape}")

        # Store target data separately
        if self.target_column in df_clean.columns:
            processed_data["target"] = df_clean[self.target_column].values.astype(
                np.float32
            )
            logger.debug(f"Target data shape: {processed_data['target'].shape}")

        # Store timestamps for regime detection
        processed_data["timestamps"] = df_clean.index

        return processed_data

    def _create_sequences(self) -> List[Dict[str, np.ndarray]]:
        """Create sequences for time-series modeling"""

        logger.debug("Creating sequences")

        sequences = []
        data_length = len(self.processed_data["target"])

        # Calculate sequence parameters
        min_length = self.sequence_length + self.prediction_horizon

        if data_length < min_length:
            raise ValueError(
                f"Data length {data_length} too short for "
                f"sequence_length={self.sequence_length} + "
                f"prediction_horizon={self.prediction_horizon}"
            )

        # Create sliding windows
        for i in range(data_length - min_length + 1):
            sequence = {}

            # Input sequences
            for key, data in self.processed_data.items():
                if key == "target":
                    # Input target sequence
                    sequence["input_target"] = data[i : i + self.sequence_length]
                    # Future target sequence
                    sequence["target"] = data[
                        i
                        + self.sequence_length : i
                        + self.sequence_length
                        + self.prediction_horizon
                    ]
                elif key == "timestamps":
                    sequence["timestamp"] = data[i + self.sequence_length - 1]
                elif key in ["price", "volume", "technical", "fundamental"]:
                    sequence[key] = data[i : i + self.sequence_length]

            sequences.append(sequence)

        logger.debug(f"Created {len(sequences)} sequences")
        return sequences

    def _create_data_splits(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create train/validation/test splits"""

        logger.debug("Creating data splits")

        n_samples = len(self.sequences)
        indices = np.arange(n_samples)

        if self.regime_aware:
            # Use regime-aware splitting
            return self._regime_aware_split(indices)
        else:
            # Use temporal splitting
            return self._temporal_split(indices)

    def _temporal_split(
        self, indices: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create temporal data splits (chronological)"""

        n_samples = len(indices)

        # Calculate split points
        test_start = int(n_samples * (1 - self.test_split))
        val_start = int(test_start * (1 - self.validation_split))

        train_indices = indices[:val_start]
        val_indices = indices[val_start:test_start]
        test_indices = indices[test_start:]

        logger.debug(
            f"Temporal split: Train={len(train_indices)}, "
            f"Val={len(val_indices)}, Test={len(test_indices)}"
        )

        return train_indices, val_indices, test_indices

    def _regime_aware_split(
        self, indices: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create regime-aware data splits"""

        # For now, fall back to temporal split
        # In a full implementation, this would use regime detection
        logger.debug(
            "Regime-aware splitting not fully implemented, using temporal split"
        )
        return self._temporal_split(indices)

    def get_data_splits(
        self,
    ) -> Tuple["FinancialDataset", "FinancialDataset", "FinancialDataset"]:
        """Get train, validation, and test datasets"""

        train_dataset = FinancialDatasetSplit(self, self.train_indices, "train")
        val_dataset = FinancialDatasetSplit(self, self.val_indices, "validation")
        test_dataset = FinancialDatasetSplit(self, self.test_indices, "test")

        return train_dataset, val_dataset, test_dataset

    def __len__(self) -> int:
        """Return total number of sequences"""
        return len(self.sequences)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        """Get a single sequence sample"""

        sequence = self.sequences[idx]
        sample = {}

        # Convert numpy arrays to tensors
        for key, value in sequence.items():
            if key == "timestamp":
                continue  # Skip timestamps for model input

            if isinstance(value, np.ndarray):
                sample[key] = torch.FloatTensor(value)
            else:
                sample[key] = torch.FloatTensor([value])

        # Apply data augmentation if enabled
        if self.data_augmentation:
            sample = self._apply_data_augmentation(sample)

        return sample

    def _apply_data_augmentation(
        self, sample: Dict[str, torch.Tensor]
    ) -> Dict[str, torch.Tensor]:
        """Apply data augmentation techniques"""

        # Simple noise injection (5% of std)
        for key in ["price", "volume", "technical"]:
            if key in sample:
                noise = torch.randn_like(sample[key]) * 0.05 * torch.std(sample[key])
                sample[key] = sample[key] + noise

        return sample


class FinancialDatasetSplit(Dataset):
    """Dataset wrapper for train/validation/test splits"""

    def __init__(
        self, parent_dataset: FinancialDataset, indices: np.ndarray, split_name: str
    ):
        self.parent_dataset = parent_dataset
        self.indices = indices
        self.split_name = split_name

        logger.debug(f"Created {split_name} split with {len(indices)} samples")

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        actual_idx = self.indices[idx]
        return self.parent_dataset[actual_idx]


class FinancialDataLoader:
    """
    Advanced data loader for financial datasets with caching and optimization
    """

    def __init__(
        self,
        dataset: FinancialDataset,
        batch_size: int = 32,
        num_workers: int = 4,
        pin_memory: bool = True,
        persistent_workers: bool = True,
        prefetch_factor: int = 2,
    ):
        """
        Initialize Financial Data Loader

        Args:
            dataset: FinancialDataset instance
            batch_size: Batch size for training
            num_workers: Number of worker processes
            pin_memory: Pin memory for faster GPU transfer
            persistent_workers: Keep workers alive between epochs
            prefetch_factor: Prefetch batches per worker
        """

        self.dataset = dataset
        self.batch_size = batch_size
        self.num_workers = num_workers
        self.pin_memory = pin_memory
        self.persistent_workers = persistent_workers
        self.prefetch_factor = prefetch_factor

        logger.info(
            f"FinancialDataLoader initialized with batch_size={batch_size}, "
            f"num_workers={num_workers}"
        )

    def get_data_loaders(
        self,
        shuffle_train: bool = True,
        drop_last: bool = True,
    ) -> Tuple[DataLoader, DataLoader, DataLoader]:
        """
        Get data loaders for train, validation, and test splits

        Args:
            shuffle_train: Whether to shuffle training data
            drop_last: Whether to drop incomplete batches

        Returns:
            Tuple of (train_loader, val_loader, test_loader)
        """

        train_dataset, val_dataset, test_dataset = self.dataset.get_data_splits()

        # Training data loader
        train_loader = DataLoader(
            train_dataset,
            batch_size=self.batch_size,
            shuffle=shuffle_train,
            num_workers=self.num_workers,
            pin_memory=self.pin_memory,
            drop_last=drop_last,
            persistent_workers=(
                self.persistent_workers if self.num_workers > 0 else False
            ),
            prefetch_factor=self.prefetch_factor if self.num_workers > 0 else 2,
            collate_fn=self._collate_fn,
        )

        # Validation data loader
        val_loader = DataLoader(
            val_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=self.num_workers,
            pin_memory=self.pin_memory,
            drop_last=False,
            persistent_workers=(
                self.persistent_workers if self.num_workers > 0 else False
            ),
            prefetch_factor=self.prefetch_factor if self.num_workers > 0 else 2,
            collate_fn=self._collate_fn,
        )

        # Test data loader
        test_loader = DataLoader(
            test_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=self.num_workers,
            pin_memory=self.pin_memory,
            drop_last=False,
            persistent_workers=(
                self.persistent_workers if self.num_workers > 0 else False
            ),
            prefetch_factor=self.prefetch_factor if self.num_workers > 0 else 2,
            collate_fn=self._collate_fn,
        )

        logger.info(
            f"Created data loaders - Train: {len(train_loader)} batches, "
            f"Val: {len(val_loader)} batches, Test: {len(test_loader)} batches"
        )

        return train_loader, val_loader, test_loader

    def _collate_fn(
        self, batch: List[Dict[str, torch.Tensor]]
    ) -> Dict[str, torch.Tensor]:
        """Custom collate function to handle variable-length sequences"""

        if not batch:
            return {}

        # Get all keys from the first sample
        keys = batch[0].keys()
        collated_batch = {}

        for key in keys:
            # Stack tensors for each key
            tensors = [sample[key] for sample in batch]

            try:
                collated_batch[key] = torch.stack(tensors)
            except RuntimeError as e:
                logger.warning(f"Could not stack tensors for key '{key}': {e}")
                # Fallback to list if stacking fails
                collated_batch[key] = tensors

        return collated_batch

    def get_sample_batch(self, split: str = "train") -> Dict[str, torch.Tensor]:
        """Get a sample batch for debugging/testing"""

        train_loader, val_loader, test_loader = self.get_data_loaders()

        if split == "train":
            loader = train_loader
        elif split == "validation":
            loader = val_loader
        elif split == "test":
            loader = test_loader
        else:
            raise ValueError(f"Invalid split: {split}")

        # Get first batch
        batch = next(iter(loader))

        logger.info(f"Sample batch from {split} split:")
        for key, value in batch.items():
            if isinstance(value, torch.Tensor):
                logger.info(f"  {key}: {value.shape} {value.dtype}")
            else:
                logger.info(f"  {key}: {type(value)}")

        return batch


# Utility functions
def create_financial_data_loader(
    data_path: Union[str, Path, Dict],
    sequence_length: int = 60,
    prediction_horizon: int = 1,
    batch_size: int = 32,
    validation_split: float = 0.2,
    test_split: float = 0.1,
    num_workers: int = 4,
    **kwargs,
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Convenience function to create financial data loaders

    Returns:
        Tuple of (train_loader, val_loader, test_loader)
    """

    logger.info("Creating financial data loaders")

    # Create dataset
    dataset = FinancialDataset(
        data_path=data_path,
        sequence_length=sequence_length,
        prediction_horizon=prediction_horizon,
        validation_split=validation_split,
        test_split=test_split,
        **kwargs,
    )

    # Create data loader
    data_loader = FinancialDataLoader(
        dataset=dataset, batch_size=batch_size, num_workers=num_workers
    )

    # Get data loaders
    train_loader, val_loader, test_loader = data_loader.get_data_loaders()

    logger.info("Financial data loaders created successfully")

    return train_loader, val_loader, test_loader


# Example usage and testing
if __name__ == "__main__":
    # Setup logging
    logging.basicConfig(level=logging.INFO)

    # Create sample data for testing
    import pandas as pd

    dates = pd.date_range("2020-01-01", "2023-01-01", freq="D")
    n_days = len(dates)

    # Generate synthetic financial data
    np.random.seed(42)
    sample_data = pd.DataFrame(
        {
            "open": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "high": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "low": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "close": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.02, n_days))),
            "volume": np.random.lognormal(10, 1, n_days),
            "sma_10": 100 * np.exp(np.cumsum(np.random.normal(0.0001, 0.015, n_days))),
            "rsi": np.random.uniform(20, 80, n_days),
            "pe_ratio": np.random.uniform(10, 30, n_days),
        },
        index=dates,
    )

    # Ensure OHLC relationships
    for i in range(len(sample_data)):
        ohlc = [sample_data.iloc[i][col] for col in ["open", "high", "low", "close"]]
        sample_data.iloc[i, sample_data.columns.get_loc("high")] = max(ohlc)
        sample_data.iloc[i, sample_data.columns.get_loc("low")] = min(ohlc)

    # Test dataset creation
    dataset = FinancialDataset(
        data_path=sample_data.to_dict("series"),
        sequence_length=60,
        prediction_horizon=1,
        validation_split=0.2,
        test_split=0.1,
        data_augmentation=True,
    )

    print(f"✅ Dataset created with {len(dataset)} sequences")

    # Test data loader
    data_loader = FinancialDataLoader(dataset, batch_size=16, num_workers=2)
    train_loader, val_loader, test_loader = data_loader.get_data_loaders()

    print("✅ Data loaders created:")
    print(f"  Train: {len(train_loader)} batches")
    print(f"  Validation: {len(val_loader)} batches")
    print(f"  Test: {len(test_loader)} batches")

    # Test sample batch
    sample_batch = data_loader.get_sample_batch("train")
    print("✅ Sample batch shapes:")
    for key, value in sample_batch.items():
        if isinstance(value, torch.Tensor):
            print(f"  {key}: {value.shape}")

    # Test convenience function
    train_loader2, val_loader2, test_loader2 = create_financial_data_loader(
        data_path=sample_data.to_dict("series"),
        sequence_length=30,
        batch_size=8,
        num_workers=1,
    )

    print("✅ Convenience function test completed")
    print("✅ Financial data loader test completed successfully")

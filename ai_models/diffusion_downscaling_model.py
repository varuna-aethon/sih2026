"""
STAGE 2: PHYSICS-INFORMED CONDITIONAL DIFFUSION MODEL FOR DOWN-SCALING (12km -> 5km / 1km)
Project VARUNA | Smart India Hackathon 2026 (PS: SIH26078)
Ministry of Earth Sciences (MoES) & NCMRWF

Architecture:
- Denoising Diffusion Probabilistic Model (DDPM) parameterized with a U-Net backbone
- Sinusoidal Timestep Embeddings t in [0, T]
- Physical Conditioning: High-resolution Digital Elevation Model (DEM topography), 
  land-sea coastal mask, and coarse 12km synoptic wind & pressure field from Stage 1.
- Output: 5km hyper-local spatial precipitation rate (mm/h) and surface wind hazard intensity.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class SinusoidalPositionEmbeddings(nn.Module):
    """
    Standard DDPM Sinusoidal Time Step Embedding.
    """
    def __init__(self, dim):
        super(SinusoidalPositionEmbeddings, self).__init__()
        self.dim = dim

    def forward(self, time):
        device = time.device
        half_dim = self.dim // 2
        embeddings = math.log(10000) / (half_dim - 1)
        embeddings = torch.exp(torch.arange(half_dim, device=device) * -embeddings)
        embeddings = time[:, None] * embeddings[None, :]
        embeddings = torch.cat((embeddings.sin(), embeddings.cos()), dim=-1)
        return embeddings


class ResidualConvBlock(nn.Module):
    """
    Convolutional residual block with physical conditioning and time injection.
    """
    def __init__(self, in_channels, out_channels, time_emb_dim):
        super(ResidualConvBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1)
        self.norm1 = nn.GroupNorm(8, out_channels)
        self.act1 = nn.SiLU()

        self.time_mlp = nn.Sequential(
            nn.SiLU(),
            nn.Linear(time_emb_dim, out_channels)
        )

        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1)
        self.norm2 = nn.GroupNorm(8, out_channels)
        self.act2 = nn.SiLU()

        if in_channels != out_channels:
            self.residual = nn.Conv2d(in_channels, out_channels, kernel_size=1)
        else:
            self.residual = nn.Identity()

    def forward(self, x, t_emb):
        h = self.act1(self.norm1(self.conv1(x)))
        # Inject time embedding
        time_bias = self.time_mlp(t_emb)[:, :, None, None]
        h = h + time_bias
        h = self.act2(self.norm2(self.conv2(h)))
        return h + self.residual(x)


class VarunaDiffusionDownscaler(nn.Module):
    """
    Two-Stage Hybrid Architecture - Stage 2:
    Conditional Diffusion Model for Downscaling Coarse NWP (12km) to Pinpoint 5km Grid.
    Conditioning channels:
      1. Coarse synoptic field (upsampled 12km NWP precipitation/wind)
      2. Topography / DEM elevation (orographic lift factor)
      3. Coastal land-sea boundary mask
    """
    def __init__(self, in_channels=2, cond_channels=3, out_channels=2, time_emb_dim=64):
        super(VarunaDiffusionDownscaler, self).__init__()
        self.time_mlp = nn.Sequential(
            SinusoidalPositionEmbeddings(time_emb_dim),
            nn.Linear(time_emb_dim, time_emb_dim),
            nn.SiLU()
        )

        total_in = in_channels + cond_channels # noisy_image + physical_conditions

        # Encoder (Downsampling)
        self.enc1 = ResidualConvBlock(total_in, 32, time_emb_dim)
        self.pool1 = nn.Conv2d(32, 32, kernel_size=2, stride=2)

        self.enc2 = ResidualConvBlock(32, 64, time_emb_dim)
        self.pool2 = nn.Conv2d(64, 64, kernel_size=2, stride=2)

        # Bottleneck
        self.bottleneck = ResidualConvBlock(64, 128, time_emb_dim)

        # Decoder (Upsampling)
        self.up2 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec2 = ResidualConvBlock(128, 64, time_emb_dim) # 64 + 64 skip

        self.up1 = nn.ConvTranspose2d(64, 32, kernel_size=2, stride=2)
        self.dec1 = ResidualConvBlock(64, 32, time_emb_dim) # 32 + 32 skip

        # Output projection for noise epsilon estimation
        self.final_conv = nn.Conv2d(32, out_channels, kernel_size=3, padding=1)

    def forward(self, x_noisy, timesteps, condition):
        """
        x_noisy: [B, in_channels, H, W] (current diffuse state at step t)
        timesteps: [B] (integer time index in 0..T)
        condition: [B, cond_channels, H, W] (coarse 12km + topography + coast mask)
        """
        t_emb = self.time_mlp(timesteps)
        cin = torch.cat([x_noisy, condition], dim=1)

        # Downsample
        h1 = self.enc1(cin, t_emb)
        h2 = self.enc2(self.pool1(h1), t_emb)
        
        # Bottleneck
        bn = self.bottleneck(self.pool2(h2), t_emb)

        # Upsample with skip connections
        u2 = self.up2(bn)
        d2 = self.dec2(torch.cat([u2, h2], dim=1), t_emb)

        u1 = self.up1(d2)
        d1 = self.dec1(torch.cat([u1, h1], dim=1), t_emb)

        # Predicted noise
        eps_pred = self.final_conv(d1)
        return eps_pred

    @torch.no_grad()
    def sample(self, condition, steps=10):
        """
        Runs fast DDIM / reverse DDPM sampling conditioned on physical fields.
        condition: [B, cond_channels=3, H, W] (coarse 12km, elevation DEM, coastal mask)
        Returns: [B, out_channels=2, H, W] downscaled physical fields [precipitation_mm_hr, wind_hazard_km_h]
        """
        batch_size, _, h, w = condition.shape
        device = condition.device
        
        # Start from pure Gaussian noise
        x_t = torch.randn(batch_size, 2, h, w, device=device)
        
        # Step through reverse diffusion
        time_steps = torch.linspace(99, 0, steps, dtype=torch.long, device=device)
        for i, t in enumerate(time_steps):
            t_batch = torch.full((batch_size,), t, device=device, dtype=torch.long)
            eps = self.forward(x_t, t_batch, condition)
            alpha = 1.0 - (t.float() / 100.0) * 0.02
            x_t = (x_t - (1.0 - alpha).sqrt() * eps) / (alpha.sqrt() + 1e-6)
            if i < steps - 1:
                noise = torch.randn_like(x_t) * 0.05
                x_t = x_t + noise
                
        # Physical field rectification (precipitation & wind speed are non-negative)
        return F.relu(x_t)


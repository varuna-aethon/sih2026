"""
STAGE 1: SPHERICAL GRAPH NEURAL NETWORK (GNN) FOR SYNOPTIC HAZARD TRAJECTORY TRACKING
Project VARUNA | Smart India Hackathon 2026 (PS: SIH26078)
Ministry of Earth Sciences (MoES) & NCMRWF

Architecture:
- Spherical Multi-Resolution Icosahedral Mesh (nodes: lat/lon atmospheric state vectors)
- Message Passing Neural Network (MPNN) across spatial mesh edges with physical edge distance embeddings
- Inputs: 6 surface and tropospheric features: [T2m, MSLP, U10m, V10m, Relative Humidity, Precipitable Water]
- Predicts: 6-hour Delta [d_lat, d_lon, d_mslp, d_wind] trajectory vector and intensity change
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class SphericalEdgeEncoder(nn.Module):
    """
    Computes physical spherical geodesic distance and directional bearings 
    between mesh nodes on Earth sphere (radius R = 6371.0 km).
    """
    def __init__(self, in_features=3, hidden_dim=32, out_features=16):
        super(SphericalEdgeEncoder, self).__init__()
        self.mlp = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, out_features),
            nn.LayerNorm(out_features)
        )

    def forward(self, edge_attrs):
        # edge_attrs: [dx, dy, spherical_geodesic_dist]
        return self.mlp(edge_attrs)


class SphericalGraphConvLayer(nn.Module):
    """
    Message Passing Layer with spatial attention over spherical neighboring nodes.
    m_ij = MLP([h_i, h_j, e_ij])
    h_i' = LayerNorm(h_i + Aggregate(m_ij * attention_ij))
    """
    def __init__(self, node_dim=64, edge_dim=16):
        super(SphericalGraphConvLayer, self).__init__()
        self.msg_mlp = nn.Sequential(
            nn.Linear(node_dim * 2 + edge_dim, node_dim),
            nn.SiLU(),
            nn.Linear(node_dim, node_dim)
        )
        self.attn_mlp = nn.Sequential(
            nn.Linear(node_dim * 2 + edge_dim, 1),
            nn.LeakyReLU(0.2)
        )
        self.update_mlp = nn.Sequential(
            nn.Linear(node_dim * 2, node_dim),
            nn.SiLU(),
            nn.Linear(node_dim, node_dim)
        )
        self.norm = nn.LayerNorm(node_dim)

    def forward(self, x, edge_index, edge_attr):
        """
        x: [num_nodes, node_dim]
        edge_index: [2, num_edges] (source -> target)
        edge_attr: [num_edges, edge_dim]
        """
        src, dst = edge_index[0], edge_index[1]
        node_pairs = torch.cat([x[src], x[dst], edge_attr], dim=-1)
        
        # Messages and spatial attention weights
        messages = self.msg_mlp(node_pairs) # [num_edges, node_dim]
        attn_logits = self.attn_mlp(node_pairs) # [num_edges, 1]
        
        # Softmax over neighborhood approximated with sigmoid gating
        attn_weights = torch.sigmoid(attn_logits)
        weighted_msgs = messages * attn_weights

        # Aggregate messages into destination nodes
        aggr = torch.zeros_like(x)
        aggr.index_add_(0, dst, weighted_msgs)

        # Update node states with residual connection
        out = self.update_mlp(torch.cat([x, aggr], dim=-1))
        return self.norm(x + out)


class VarunaSphericalGNN(nn.Module):
    """
    Two-Stage Hybrid Architecture - Stage 1:
    Spherical Graph Neural Network for Cyclone & Extreme Weather Trajectory Tracking.
    """
    def __init__(self, in_node_features=6, hidden_dim=64, edge_features=3, edge_emb_dim=16, num_layers=4):
        super(VarunaSphericalGNN, self).__init__()
        self.node_encoder = nn.Sequential(
            nn.Linear(in_node_features, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim)
        )
        self.edge_encoder = SphericalEdgeEncoder(in_features=edge_features, out_features=edge_emb_dim)

        self.conv_layers = nn.ModuleList([
            SphericalGraphConvLayer(node_dim=hidden_dim, edge_dim=edge_emb_dim)
            for _ in range(num_layers)
        ])

        # Trajectory & Intensity Prediction Head:
        # [delta_latitude, delta_longitude, delta_mslp_hPa, delta_max_wind_kts]
        self.pred_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.SiLU(),
            nn.Linear(hidden_dim // 2, 4)
        )

    def forward(self, x, edge_index, edge_attr):
        h = self.node_encoder(x)
        e = self.edge_encoder(edge_attr)
        
        for layer in self.conv_layers:
            h = layer(h, edge_index, e)
            
        preds = self.pred_head(h)
        return preds, h

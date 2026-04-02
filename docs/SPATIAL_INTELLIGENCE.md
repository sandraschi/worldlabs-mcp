# Spatial Intelligence & The World Model Scene (2026)

> "In 2026, embodied intelligence—models inhabiting robots with sensory and proprioceptive feedback—and spatial intelligence—understanding the world's physical, spatial, and causal relations—converge to define the next era of AI."

## 🔬 Core Concepts

### 1. Spatial Intelligence
Spatial intelligence is the capability of an AI to perceive, reason about, and interact with the 3D physical world. Unlike LLMs, which operate on the statistics of language, **Large World Models (LWMs)** operate on the physics of space.

*   **World Grounding**: The model understands that objects exist in 3D space even when not visible (Object Permanence).
*   **Intuitive Physics**: Predicting the outcome of a physical interaction (momentum, gravity, collision).
*   **Persistent Geometry**: Maintaining a cohesive 3D representation across time and viewpoint changes.

### 2. Embodied vs. Spatial Intelligence
While often used interchangeably, these are complementary dimensions:
*   **Embodied Intelligence**: The model "inhabits" a physical substrate (robot, drone). Focuses on sensorimotor loops, proprioception (knowing where its limbs are), and real-time navigation.
*   **Spatial Intelligence**: The model "knows" the world. Focuses on the causal and structural map of reality. Spatial intelligence provides the *prior* that embodied intelligence uses to act.

---

## 🌪️ The Competitive Landscape (2026)

### **World Labs: The Specialists (Marble API)**
World Labs leads in **High-Fidelity Generative World Models**. Their flagship model, **Marble**, is designed to generate spatially cohesive, persistent 3D worlds from minimal inputs.
*   **Strength**: Maximum visual and structural fidelity. Persistent environments that don't "drift" over time.
*   **Best For**: Simulation environments, virtual production, high-end design, and robotics training grounds.

### **AMI Labs (Yann LeCun): The Latent Insurgents (LeWM)**
Yann LeCun's **LeWorldModel (LeWM)** project riffs on the "models must know the world" meme by using a **Joint-Embedding Predictive Architecture (JEPA)**.
*   **Strength**: Efficiency and abstract reasoning. LeWM predicts in a latent space rather than a pixel space, avoiding the computational cost of "drawing" every frame.
*   **Philosophy**: "Predicting representations, not pixels." It ignores irrelevant noise to focus on core world dynamics.
*   **Best For**: High-level task planning and long-horizon causal reasoning.

### **Google DeepMind: The Interactive Heavyweights (Genie 3)**
Google's **Genie 3** focuses on **Interactive Simulation**.
*   **Strength**: Real-time performance. Genie can generate navigable 3D environments at high frame rates, acting as a real-time game engine.
*   **Best For**: Real-time game testing, interactive digital twins, and immediate visual feedback loops.

### **Alibaba & Chinese Labs: The Efficiency-First Industrial Scale**
Chinese labs (Qwen / Baidu / OpenXLab) lead in **Industrial Efficiency**.
*   **Strength**: Optimized for deployment in low-compute environments (Edge AI for autonomous vehicles).
*   **Best For**: Autonomous driving digital twins and smart city infrastructure.

---

## 🛠️ Practical Integration (MCP)

The `worldlabs-mcp` bridge enables agents to tap into this spatial intelligence layer. By using the `Marble API`, an agent can:
1.  **Generate** a simulation environment for a robotics task.
2.  **Verify** physical constraints before executing a command in the real world.
3.  **Bridge** the gap between a language-based goal ("Clean the kitchen") and a spatially-grounded execution plan.

---

## 📚 Reference Registry

- **LeWM (LeWorldModel)**: Using SIGReg (Sketched-Isotropic-Gaussian Regularizer) for stable latent-space world models.
- **Marble (World Labs)**: The authoritative engine for spatial world generation.
- **V-JEPA (Meta)**: Video-based Joint-Embedding Predictive Architecture.
- **Genie 3 (DeepMind)**: The interactive visual world model foundation.

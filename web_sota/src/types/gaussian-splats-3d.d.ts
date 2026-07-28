// Type declaration for @mkkellogg/gaussian-splats-3d (no @types package available)
declare module "@mkkellogg/gaussian-splats-3d" {
  export class Viewer {
    constructor(options?: Record<string, unknown>);
    addSplatScene(
      url: string,
      options?: Record<string, unknown>,
    ): Promise<void>;
    start(): void;
    dispose(): void;
  }
  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }
}

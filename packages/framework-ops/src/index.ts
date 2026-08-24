export type SerializedFrameworkProjectDescriptor = unknown;

export interface FrameworkOpsDescriptorBoundary<TValidatedDescriptor, TOpsProjection> {
  validate(input: SerializedFrameworkProjectDescriptor): TValidatedDescriptor;
  map(descriptor: TValidatedDescriptor): TOpsProjection;
}

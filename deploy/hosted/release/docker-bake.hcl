variable "RELEASE_IMAGE" {
  default = "registry.example.invalid/unisane-ops-hosted-runtime:replace-with-release"
}

variable "RELEASE_SOURCE" {
  default = "https://example.invalid/unisane"
}

variable "RELEASE_REVISION" {
  default = "replace-with-source-revision"
}

variable "RELEASE_VERSION" {
  default = "replace-with-release-version"
}

group "default" {
  targets = ["runtime"]
}

target "runtime" {
  context    = "."
  dockerfile = "unisane-ops/apps/hosted-runtime/Dockerfile"
  target     = "runtime"
  tags       = [RELEASE_IMAGE]
  platforms  = ["linux/amd64", "linux/arm64"]
  attest = [
    "type=provenance,mode=max,version=v1",
    "type=sbom",
  ]
  annotations = [
    "index,manifest:org.opencontainers.image.source=${RELEASE_SOURCE}",
    "index,manifest:org.opencontainers.image.revision=${RELEASE_REVISION}",
    "index,manifest:org.opencontainers.image.version=${RELEASE_VERSION}",
  ]
}

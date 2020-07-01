#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[1]}")" ; pwd -P )

docker run --rm \
  -v "$parent_path/doc":/out \
  -v "$parent_path/src/protos":/protos \
  pseudomuto/protoc-gen-doc --doc_opt=markdown,protos.md
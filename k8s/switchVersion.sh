#!/bin/bash

# Script to switch traffic between blue and green deployments

TARGET_VERSION=$1

if [ "$TARGET_VERSION" != "blue" ] && [ "$TARGET_VERSION" != "green" ]; then
  echo "Error: Version must be either 'blue' or 'green'"
  echo "Usage: $0 [blue|green]"
  exit 1
fi

echo "Switching main service to point to $TARGET_VERSION deployment..."

# Update the selector in the main service to point to the specified version
kubectl patch service email-verifier -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET_VERSION\"}}}"

echo "Traffic is now being routed to the $TARGET_VERSION deployment."
echo "You can verify by accessing the main endpoint."

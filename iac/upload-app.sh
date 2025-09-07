#!/bin/bash

# Quick script to upload the built app and invalidate CloudFront cache
set -e

echo "🚀 Uploading application to existing infrastructure..."

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
  echo "❌ Error: Please run this script from the iac/ directory"
  exit 1
fi

# Make sure the app is built
echo "📦 Ensuring app is built..."
cd ..
npm run build
cd iac

# Get bucket name and distribution ID
echo "📊 Getting deployment information..."
BUCKET_NAME=$(aws s3 ls | grep bushrunners-spa | awk '{print $3}')
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Aliases.Items[0]==`bbr.home.ahmadreza.com`].Id' --output text)

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Error: Could not find S3 bucket. Make sure the infrastructure is deployed."
  exit 1
fi

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "❌ Error: Could not find CloudFront distribution."
  exit 1
fi

echo "📤 Found bucket: $BUCKET_NAME"
echo "🌐 Found distribution: $DISTRIBUTION_ID"

# Upload files to S3
echo "📤 Uploading application files..."
aws s3 sync ../dist s3://$BUCKET_NAME --delete --cache-control "public, max-age=31536000" --exclude "*.html"
aws s3 sync ../dist s3://$BUCKET_NAME --delete --cache-control "no-cache, no-store, must-revalidate" --include "*.html"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --query 'Invalidation.Id' --output text)

echo ""
echo "✅ Upload complete!"
echo "🔄 Cache invalidation ID: $INVALIDATION_ID"
echo ""
echo "⏰ Please wait 5-15 minutes for the cache invalidation to complete."
echo "🌐 Your site: https://bbr.home.ahmadreza.com"
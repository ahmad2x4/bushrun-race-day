#!/bin/bash

# Bushrunners SPA Deployment Script
set -e

echo "🚀 Starting Bushrunners SPA deployment..."

# Check if we're in the right directory
if [ ! -f "../package.json" ]; then
  echo "❌ Error: Please run this script from the iac/ directory"
  exit 1
fi

# Step 1: Build the React app (production build excluding Storybook)
echo "📦 Building React application for production..."
cd ..
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Error: Build failed - dist directory not found"
  exit 1
fi

echo "✅ Production build successful - $(du -sh dist | cut -f1) generated"

cd iac

# Step 2: Install CDK dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Step 3: Build CDK TypeScript
echo "🔨 Building CDK TypeScript..."
npm run build

# Step 4: Bootstrap CDK (only needed first time)
echo "🏗️ Bootstrapping CDK (if needed)..."
npx cdk bootstrap --region us-east-1

# Step 5: Deploy infrastructure stack (us-east-1)
echo "🏗️ Deploying infrastructure stack (us-east-1)..."
npx cdk deploy BushrunnersSpaStack --require-approval never

# Step 6: Get stack outputs for deployment
echo "📊 Getting deployment information..."
BUCKET_NAME=$(npx cdk deploy BushrunnersSpaStack --outputs-file outputs.json --require-approval never > /dev/null 2>&1 && cat outputs.json | grep -o '"BucketName": "[^"]*"' | cut -d'"' -f4)
DISTRIBUTION_ID=$(cat outputs.json | grep -o '"DistributionId": "[^"]*"' | cut -d'"' -f4)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo "⚠️  Could not get bucket name or distribution ID. Trying alternative method..."
  BUCKET_NAME=$(aws s3 ls | grep bushrunners-spa | awk '{print $3}')
  DISTRIBUTION_ID=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`Created by CDK`].Id' --output text | head -1)
fi

if [ -n "$BUCKET_NAME" ] && [ -n "$DISTRIBUTION_ID" ]; then
  # Step 7: Upload built files to S3
  echo "📤 Uploading application files to S3 bucket: $BUCKET_NAME"
  aws s3 sync ../dist s3://$BUCKET_NAME --delete --cache-control "public, max-age=31536000" --exclude "*.html"
  aws s3 sync ../dist s3://$BUCKET_NAME --delete --cache-control "no-cache, no-store, must-revalidate" --include "*.html"

  # Step 8: Invalidate CloudFront cache
  echo "🔄 Invalidating CloudFront cache: $DISTRIBUTION_ID"
  INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --query 'Invalidation.Id' --output text)
  echo "✅ Cache invalidation created: $INVALIDATION_ID"
else
  echo "⚠️  Could not determine S3 bucket or CloudFront distribution. Please upload files manually."
fi

# Clean up
rm -f outputs.json

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. If this is the first deployment, SSL certificate validation may take 5-30 minutes"
echo "2. CloudFront cache invalidation may take 5-15 minutes to propagate"
echo "3. DNS changes may take up to 48 hours to propagate globally"
echo ""
echo "🌐 Your site will be available at: https://bbr.home.ahmadreza.com"
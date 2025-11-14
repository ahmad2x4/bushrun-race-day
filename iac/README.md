# Bushrunners SPA Infrastructure

This directory contains AWS CDK infrastructure code for deploying the Bushrunners Race Day Single Page Application.

## Architecture

- **S3 Bucket**: Hosts the static React application files
- **CloudFront**: Global CDN with SSL/TLS termination
- **Route 53**: DNS management for custom domain
- **ACM Certificate**: SSL certificate for HTTPS

## Domain Configuration

- **Domain**: `bushrun.example.com` (replace with your domain)
- **Hosted Zone**: Your Route53 hosted zone ID
- **Region**: `us-east-1` (N. Virginia) - All resources (CloudFront + ACM requirement)
- **SSL**: Automatic certificate provisioning via ACM

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js and npm** installed
3. **AWS CDK CLI** installed globally: `npm install -g aws-cdk`
4. **Domain hosted zone** (optional, can be configured later)

## Deployment

### Option 1: Automated Deployment

```bash
# Run the automated deployment script
cd iac
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Build the React app
cd ../
npm run build

# 2. Install CDK dependencies
cd iac
npm install

# 3. Build CDK TypeScript
npm run build

# 4. Bootstrap CDK (first time only)
npx cdk bootstrap --region us-east-1

# 5. Deploy infrastructure stack
npx cdk deploy BushrunnersSpaStack --require-approval never
```

## Configuration

### Custom Hosted Zone

If you have an existing Route 53 hosted zone, you can specify it:

```bash
npx cdk deploy -c hostedZoneId=Z1234567890ABC BushrunnersSpaStack
```

### Different Domain

To use a different domain, modify `iac/bin/iac.ts`:

```typescript
const domainName = 'bushrun.example.com'; // Replace with your domain
const hostedZoneId = 'YOUR_HOSTED_ZONE_ID'; // Replace with your hosted zone ID
```

## CDK Commands

- `npm run build`: Compile TypeScript to JavaScript
- `npm run watch`: Watch for changes and compile
- `npm run test`: Perform unit tests
- `npx cdk deploy`: Deploy stack to AWS
- `npx cdk diff`: Compare deployed stack with current state
- `npx cdk synth`: Emit synthesized CloudFormation template
- `npx cdk destroy`: Remove the stack from AWS

## Outputs

After deployment, the stack provides these outputs:

- **BucketName**: S3 bucket name for uploads
- **DistributionId**: CloudFront distribution ID for cache invalidation
- **DistributionDomainName**: CloudFront domain name
- **WebsiteURL**: Final website URL (https://bushrun.example.com)

## Security

- **Origin Access Control (OAC)**: Prevents direct S3 access
- **HTTPS Only**: All HTTP traffic redirected to HTTPS
- **Security Headers**: Applied via CloudFront response headers policy
- **Block Public Access**: S3 bucket blocks all public access

## Cost Optimization

- **Price Class**: Limited to North America and Europe (PRICE_CLASS_100)
- **Caching**: Optimized caching policy for static assets
- **Auto Delete**: Resources are removed when stack is destroyed

## Troubleshooting

### Certificate Validation

SSL certificate validation may take 5-30 minutes. Check ACM console for status.

### DNS Propagation

DNS changes can take up to 48 hours to propagate globally.

### CloudFront Cache

If updates aren't visible, invalidate CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

## File Structure

```
iac/
├── bin/
│   └── iac.ts              # CDK app entry point
├── lib/
│   ├── iac-stack.ts        # Main infrastructure stack
│   └── deployment-stack.ts # Deployment utilities
├── deploy.sh               # Automated deployment script
├── package.json            # CDK dependencies
└── README.md              # This file
```

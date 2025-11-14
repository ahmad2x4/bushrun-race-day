#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IacStack } from '../lib/iac-stack';

const app = new cdk.App();

// Configuration
const domainName = 'bushrun.example.com'; // Replace with your domain
const hostedZoneId = 'YOUR_HOSTED_ZONE_ID'; // Replace with your Route53 hosted zone ID

// Single stack approach - deploy everything in us-east-1 to avoid cross-region issues
// CloudFront is global anyway, so the S3 location doesn't matter much for performance
new IacStack(app, 'BushrunnersSpaStack', {
  stackName: 'bushrunners-spa-infrastructure',
  description: 'Infrastructure for Bushrunners Race Day SPA',
  domainName,
  hostedZoneId,
  
  // Deploy everything in us-east-1 to avoid cross-region certificate issues
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1', // CloudFront + ACM requires us-east-1
  },
  
  tags: {
    Project: 'Bushrunners',
    Environment: 'production',
    Application: 'race-day-spa',
  },
});
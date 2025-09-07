import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface DeploymentStackProps extends cdk.StackProps {
  readonly bucket: s3.Bucket;
  readonly distribution: cloudfront.Distribution;
  readonly buildPath: string;
}

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const { bucket, distribution, buildPath } = props;

    // Deploy built app to S3 and invalidate CloudFront
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(buildPath)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'], // Invalidate all paths
      prune: true, // Remove old files
    });

    // Output deployment information
    new cdk.CfnOutput(this, 'DeploymentComplete', {
      value: 'Website deployed successfully',
      description: 'Deployment Status',
    });
  }
}
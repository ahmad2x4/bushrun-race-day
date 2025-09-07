import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface CertificateStackProps extends cdk.StackProps {
  readonly domainName: string;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const { domainName } = props;

    // SSL Certificate for CloudFront (must be in us-east-1)
    this.certificate = new certificatemanager.Certificate(this, 'CloudFrontCertificate', {
      domainName,
      validation: certificatemanager.CertificateValidation.fromDns(),
    });

    // Output certificate ARN for cross-stack reference
    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      description: 'ACM Certificate ARN for CloudFront (us-east-1)',
      exportName: 'BushrunnersCloudFrontCertificateArn',
    });
  }
}